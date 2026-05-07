import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface ChunkInsert {
  id: string;
  projectId: string;
  source: string;
  anchor: string | null;
  headingPath: string | null;
  content: string;
  tokenCount: number;
  embedding: number[];
  scanId: string;
}

export interface RetrievedChunk {
  id: string;
  source: string;
  anchor: string | null;
  headingPath: string | null;
  content: string;
  similarity: number;
}

function vectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

@Injectable()
export class ChatChunkRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async deleteByProject(projectId: string): Promise<void> {
    await this.ds.query('DELETE FROM chat_chunks WHERE "projectId" = $1', [projectId]);
  }

  async insertMany(rows: ChunkInsert[]): Promise<void> {
    if (rows.length === 0) return;
    const values: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    for (const r of rows) {
      values.push(
        `($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}::vector, $${p++}, NOW(), NOW())`,
      );
      params.push(
        r.id,
        r.projectId,
        r.source,
        r.anchor,
        r.headingPath,
        r.content,
        r.tokenCount,
        vectorLiteral(r.embedding),
        r.scanId,
      );
    }
    await this.ds.query(
      `INSERT INTO chat_chunks (id, "projectId", source, anchor, "headingPath", content, "tokenCount", embedding, "scanId", "createdAt", "updatedAt") VALUES ${values.join(',')}`,
      params,
    );
  }

  async search(
    projectId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]> {
    const rows = await this.ds.query<
      Array<{
        id: string;
        source: string;
        anchor: string | null;
        headingPath: string | null;
        content: string;
        distance: string;
      }>
    >(
      `SELECT id, source, anchor, "headingPath", content, embedding <=> $2::vector AS distance
       FROM chat_chunks
       WHERE "projectId" = $1
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      [projectId, vectorLiteral(queryEmbedding), topK],
    );
    return rows.map((r) => ({
      id: r.id,
      source: r.source,
      anchor: r.anchor,
      headingPath: r.headingPath,
      content: r.content,
      similarity: 1 - parseFloat(r.distance),
    }));
  }

  async countByProject(projectId: string): Promise<number> {
    const rows = await this.ds.query<Array<{ count: string }>>(
      'SELECT COUNT(*)::int AS count FROM chat_chunks WHERE "projectId" = $1',
      [projectId],
    );
    return rows[0]?.count ? Number(rows[0].count) : 0;
  }
}
