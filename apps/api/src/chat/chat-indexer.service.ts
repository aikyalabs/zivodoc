import crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import { ChatChunkRepository, type ChunkInsert } from '@db/repositories';

import { chunkPage } from './chunker';
import { EmbeddingsService } from './embeddings.service';

export interface IndexablePage {
  url?: string | undefined;
  filePath?: string | undefined;
  title: string | null;
  rawContent?: string | undefined;
}

const EMBED_BATCH_SIZE = 96;

@Injectable()
export class ChatIndexerService {
  private readonly logger = new Logger(ChatIndexerService.name);

  constructor(
    private readonly chunks: ChatChunkRepository,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async indexProject(
    projectId: string,
    organizationId: string,
    scanId: string,
    pages: IndexablePage[],
  ): Promise<{ indexed: number; skipped: boolean; reason?: string }> {
    const allChunks = pages.flatMap((p) => chunkPage(p));
    if (allChunks.length === 0) {
      this.logger.log(`No chunks for project ${projectId} — clearing existing index`);
      await this.chunks.deleteByProject(projectId);
      return { indexed: 0, skipped: false };
    }

    let embeddings: number[][];
    try {
      embeddings = await this.embedBatched(
        allChunks.map((c) => this.formatForEmbedding(c)),
        organizationId,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Skipping chat indexing for ${projectId}: ${message}`);
      return { indexed: 0, skipped: true, reason: message };
    }

    const rows: ChunkInsert[] = allChunks.map((c, i) => ({
      id: `chunk_${crypto.randomBytes(12).toString('hex')}`,
      projectId,
      source: c.source,
      anchor: c.anchor,
      headingPath: c.headingPath,
      content: c.content,
      tokenCount: c.tokenCount,
      embedding: embeddings[i],
      scanId,
    }));

    await this.chunks.deleteByProject(projectId);
    for (let i = 0; i < rows.length; i += 200) {
      await this.chunks.insertMany(rows.slice(i, i + 200));
    }

    this.logger.log(`Indexed ${rows.length} chunks for project ${projectId}`);
    return { indexed: rows.length, skipped: false };
  }

  private formatForEmbedding(chunk: { headingPath: string | null; content: string }): string {
    return chunk.headingPath ? `${chunk.headingPath}\n\n${chunk.content}` : chunk.content;
  }

  private async embedBatched(texts: string[], organizationId: string): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
      const vecs = await this.embeddings.embedBatch(batch, organizationId);
      out.push(...vecs);
    }
    return out;
  }
}
