import crypto from 'crypto';

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { AiKeysService } from '@src/ai-keys/ai-keys.service';
import {
  ChatChunkRepository,
  ChatMessageRepository,
  ChatSessionRepository,
  ProjectRepository,
  type RetrievedChunk,
} from '@db/repositories';
import type { Citation } from '@db/entities';

import { EmbeddingsService } from './embeddings.service';

const TOP_K = 8;
const MAX_QUESTION_CHARS = 1500;
const SYSTEM_PROMPT = `You are an assistant embedded in a product's documentation site. Answer the user's question using ONLY the provided documentation excerpts. If the answer is not contained in the excerpts, say so honestly and suggest where the user might look. Be concise. When you reference information, cite the source by its number like [1] [2]. Never invent URLs, code, or behavior.`;

interface ChunkContext {
  number: number;
  source: string;
  anchor: string | null;
  headingPath: string | null;
  content: string;
}

export interface AnswerStreamChunk {
  type: 'token' | 'done' | 'error' | 'citations';
  data: string | Citation[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chunks: ChatChunkRepository,
    private readonly sessions: ChatSessionRepository,
    private readonly messages: ChatMessageRepository,
    private readonly projects: ProjectRepository,
    private readonly aiKeys: AiKeysService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
  }

  async createSession(
    projectId: string,
    ip: string,
    pageUrl: string | null,
    origin: string | null,
  ): Promise<{ sessionId: string }> {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');

    const session = this.sessions.create({
      projectId,
      ipHash: this.hashIp(ip),
      origin: origin?.slice(0, 500) ?? null,
      pageUrl: pageUrl?.slice(0, 500) ?? null,
    });
    const saved = await this.sessions.save(session);
    return { sessionId: saved.id };
  }

  async *streamAnswer(args: {
    sessionId: string;
    question: string;
  }): AsyncGenerator<AnswerStreamChunk> {
    const question = args.question.trim();
    if (!question) throw new BadRequestException('Question is empty.');
    if (question.length > MAX_QUESTION_CHARS) {
      throw new BadRequestException(`Question is too long (max ${MAX_QUESTION_CHARS} chars).`);
    }

    const session = await this.sessions.findOne({ where: { id: args.sessionId } });
    if (!session) throw new NotFoundException('Session not found.');

    const project = await this.projects.findOne({ where: { id: session.projectId } });
    if (!project) throw new NotFoundException('Project no longer exists.');

    const startTime = Date.now();
    const queryVec = await this.embeddings.embed(question, project.organizationId);
    const retrieved = await this.chunks.search(session.projectId, queryVec, TOP_K);

    if (retrieved.length === 0) {
      const fallback = `I don't have any documentation indexed for this project yet. Once a scan completes, I'll be able to answer questions.`;
      yield { type: 'token', data: fallback };
      yield { type: 'done', data: '' };
      await this.persistTurn({
        sessionId: session.id,
        projectId: session.projectId,
        question,
        answer: fallback,
        retrieved: [],
        startTime,
        promptTokens: 0,
        completionTokens: 0,
        lowConfidence: true,
      });
      return;
    }

    const contexts: ChunkContext[] = retrieved.map((c, i) => ({
      number: i + 1,
      source: c.source,
      anchor: c.anchor,
      headingPath: c.headingPath,
      content: c.content,
    }));
    const citations = this.buildCitations(contexts);

    const userPrompt = this.buildUserPrompt(question, contexts);

    const ai = await this.resolveAiProvider(project.organizationId);
    if (!ai) {
      const msg = `This project's organization has not added an AI key yet, so I can't answer questions. The org admin can add one at /settings/ai-keys in the dashboard.`;
      yield { type: 'token', data: msg };
      yield { type: 'done', data: '' };
      await this.persistTurn({
        sessionId: session.id,
        projectId: session.projectId,
        question,
        answer: msg,
        retrieved,
        startTime,
        promptTokens: 0,
        completionTokens: 0,
        lowConfidence: true,
      });
      return;
    }

    yield { type: 'citations', data: citations };

    const collected: string[] = [];
    let errored = false;
    try {
      try {
        for await (const token of this.streamCompletion(ai, userPrompt)) {
          collected.push(token);
          yield { type: 'token', data: token };
        }
        yield { type: 'done', data: '' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Chat completion failed: ${msg}`);
        errored = true;
        yield { type: 'error', data: 'Failed to generate an answer. Please try again.' };
      }
    } finally {
      const fullAnswer = collected.join('');
      const lowConfidence =
        errored ||
        fullAnswer.toLowerCase().includes("i don't know") ||
        fullAnswer.toLowerCase().includes('not contained in');

      await this.persistTurn({
        sessionId: session.id,
        projectId: session.projectId,
        question,
        answer: fullAnswer,
        retrieved,
        startTime,
        promptTokens: 0,
        completionTokens: 0,
        lowConfidence,
        citations,
      }).catch((err) => {
        this.logger.warn(
          `Failed to persist chat turn: ${err instanceof Error ? err.message : err}`,
        );
      });
    }
  }

  private buildUserPrompt(question: string, contexts: ChunkContext[]): string {
    const sections = contexts
      .map((c) => {
        const heading = c.headingPath ? `Section: ${c.headingPath}\n` : '';
        return `[${c.number}] Source: ${c.source}${c.anchor ? `#${c.anchor}` : ''}\n${heading}\n${c.content}`;
      })
      .join('\n\n---\n\n');
    return `Documentation excerpts:\n\n${sections}\n\nQuestion: ${question}\n\nAnswer:`;
  }

  private buildCitations(contexts: ChunkContext[]): Citation[] {
    return contexts.map((c) => ({
      source: c.anchor ? `${c.source}#${c.anchor}` : c.source,
      anchor: c.anchor,
      headingPath: c.headingPath,
    }));
  }

  private async resolveAiProvider(
    organizationId: string,
  ): Promise<{ provider: 'anthropic' | 'openai'; apiKey: string; model: string } | null> {
    const anthropic = await this.aiKeys.getDecryptedKey(organizationId, 'anthropic');
    if (anthropic) {
      return { provider: 'anthropic', apiKey: anthropic.apiKey, model: anthropic.model };
    }
    const openai = await this.aiKeys.getDecryptedKey(organizationId, 'openai');
    if (openai) {
      return { provider: 'openai', apiKey: openai.apiKey, model: openai.model };
    }
    return null;
  }

  private async *streamCompletion(
    ai: { provider: 'anthropic' | 'openai'; apiKey: string; model: string },
    userPrompt: string,
  ): AsyncGenerator<string> {
    if (ai.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: ai.apiKey });
      const stream = await client.messages.stream({
        model: ai.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
      return;
    }

    const client = new OpenAI({ apiKey: ai.apiKey });
    const stream = await client.chat.completions.create({
      model: ai.model,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
    for await (const part of stream) {
      const token = part.choices[0]?.delta?.content;
      if (token) yield token;
    }
  }

  private async persistTurn(args: {
    sessionId: string;
    projectId: string;
    question: string;
    answer: string;
    retrieved: RetrievedChunk[];
    startTime: number;
    promptTokens: number;
    completionTokens: number;
    lowConfidence: boolean;
    citations?: Citation[];
  }): Promise<void> {
    const latency = Date.now() - args.startTime;
    const userMsg = this.messages.create({
      sessionId: args.sessionId,
      projectId: args.projectId,
      role: 'user',
      content: args.question,
      citations: null,
      retrievedChunkIds: null,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 0,
      lowConfidence: false,
    });
    const assistantMsg = this.messages.create({
      sessionId: args.sessionId,
      projectId: args.projectId,
      role: 'assistant',
      content: args.answer,
      citations: args.citations ?? null,
      retrievedChunkIds: args.retrieved.map((c) => c.id),
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      latencyMs: latency,
      lowConfidence: args.lowConfidence,
    });
    await this.messages.save([userMsg, assistantMsg]);
    await this.sessions.increment({ id: args.sessionId }, 'messageCount', 2);
  }
}
