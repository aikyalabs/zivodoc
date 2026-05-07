import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { pipeline, type FeatureExtractionPipeline, type Tensor } from '@huggingface/transformers';

import { AiKeysService } from '@src/ai-keys/ai-keys.service';
import type { AppConfig } from '@src/config.module';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private localPipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly aiKeys: AiKeysService,
  ) {}

  async embedBatch(texts: string[], organizationId: string): Promise<number[][]> {
    if (texts.length === 0) return [];

    const openai = await this.aiKeys.getDecryptedKey(organizationId, 'openai');
    if (openai) {
      try {
        return await this.embedWithOpenAI(texts, openai.apiKey);
      } catch (err) {
        this.logger.warn(
          `OpenAI embeddings failed, falling back to local: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return this.embedLocally(texts);
  }

  async embed(text: string, organizationId: string): Promise<number[]> {
    const [vec] = await this.embedBatch([text], organizationId);
    return vec;
  }

  private async embedWithOpenAI(texts: string[], apiKey: string): Promise<number[][]> {
    const client = new OpenAI({ apiKey });
    const dimensions = this.config.get('EMBEDDING_DIMENSIONS');
    const model = this.config.get('EMBEDDING_OPENAI_MODEL');
    const response = await client.embeddings.create({
      model,
      input: texts,
      dimensions,
    });
    return response.data.map((d) => d.embedding);
  }

  private async getLocalPipeline(): Promise<FeatureExtractionPipeline> {
    if (!this.localPipelinePromise) {
      const model = this.config.get('EMBEDDING_LOCAL_MODEL');
      this.logger.log(`Loading local embedding model ${model} (first call only — caches to disk)`);
      this.localPipelinePromise = pipeline(
        'feature-extraction',
        model,
      ) as Promise<FeatureExtractionPipeline>;
    }
    return this.localPipelinePromise;
  }

  private async embedLocally(texts: string[]): Promise<number[][]> {
    const extractor = await this.getLocalPipeline();
    const out: number[][] = [];
    for (const text of texts) {
      const tensor = (await extractor(text, { pooling: 'mean', normalize: true })) as Tensor;
      out.push(Array.from(tensor.data as Float32Array));
    }
    return out;
  }
}
