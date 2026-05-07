import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Ip,
  Logger,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { ChatService } from './chat.service';

const createSessionSchema = z.object({
  pageUrl: z.string().url().optional(),
});

const messageSchema = z.object({
  question: z.string().min(1).max(1500),
});

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chat: ChatService) {}

  @Throttle({ short: { limit: 5, ttl: 10_000 }, long: { limit: 50, ttl: 3600_000 } })
  @Post('projects/:projectId/sessions')
  async createSession(
    @Param('projectId') projectId: string,
    @Ip() ip: string,
    @Headers('origin') origin: string | undefined,
    @Body() body: unknown,
  ): Promise<{ sessionId: string }> {
    const parsed = createSessionSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid body');
    }
    return this.chat.createSession(projectId, ip, parsed.data.pageUrl ?? null, origin ?? null);
  }

  @Throttle({ short: { limit: 3, ttl: 10_000 }, long: { limit: 100, ttl: 86_400_000 } })
  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid body');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    const send = (event: string, data: unknown): void => {
      if (aborted) return;
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      for await (const chunk of this.chat.streamAnswer({
        sessionId,
        question: parsed.data.question,
      })) {
        if (aborted) break;
        send(chunk.type, chunk.data);
        if (chunk.type === 'done' || chunk.type === 'error') break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to stream answer';
      this.logger.error(`Chat SSE failed: ${msg}`);
      send('error', msg);
    } finally {
      if (!aborted) res.end();
    }
  }
}
