import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

import { AuditLogRepository } from '@db/repositories';

const SENSITIVE_FIELDS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'secret',
  'apikey',
]);

const SKIP_METHODS = new Set(['GET', 'OPTIONS', 'HEAD']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (SKIP_METHODS.has(request.method)) {
      return next.handle();
    }

    const startTime = Date.now();
    const auditData = this.buildAuditData(request);

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        this.logAudit({
          ...auditData,
          statusCode: response.statusCode,
          duration: Date.now() - startTime,
        });
      }),
      catchError((error) => {
        this.logAudit({
          ...auditData,
          statusCode: error.status || 500,
          duration: Date.now() - startTime,
        });
        throw error;
      }),
    );
  }

  private buildAuditData(request: Request) {
    const session = (
      request as Request & { authSession?: { userId?: string; user?: { organizationId?: string } } }
    ).authSession;

    return {
      actorId: session?.userId ?? null,
      organizationId: session?.user?.organizationId ?? null,
      method: request.method,
      path: request.originalUrl,
      action: this.buildAction(request.method, request.originalUrl),
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent']?.substring(0, 500) ?? null,
      metadata: this.buildMetadata(request),
    };
  }

  private buildAction(method: string, url: string): string {
    const cleanPath = url
      .replace(/^\/api\/v\d+\//, '')
      .replace(/\/[a-z0-9_-]{20,}/gi, '')
      .replace(/\/+/g, '/')
      .replace(/^\/|\/$/g, '');

    const parts = cleanPath.split('/').filter(Boolean);
    const resource = parts[0] || 'unknown';

    const methodToAction: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    const action =
      parts.length > 1 ? parts[parts.length - 1] : methodToAction[method] || method.toLowerCase();
    return `${resource}.${action}`;
  }

  private buildMetadata(request: Request): Record<string, unknown> | null {
    const metadata: Record<string, unknown> = {};

    if (request.params && Object.keys(request.params as object).length > 0) {
      metadata.params = request.params;
    }

    if (request.body && Object.keys(request.body as object).length > 0) {
      metadata.body = this.sanitizeBody(request.body);
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;
    if (Array.isArray(body)) return body.map((item) => this.sanitizeBody(item));

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeBody(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private logAudit(data: {
    actorId: string | null;
    organizationId: string | null;
    method: string;
    path: string;
    action: string;
    statusCode: number;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: Record<string, unknown> | null;
    duration: number;
  }): void {
    this.logger.log({
      msg: 'audit',
      ...data,
    });

    this.auditLogRepository
      .save(data)
      .catch((err) =>
        this.logger.error('Failed to persist audit log', err instanceof Error ? err.stack : err),
      );
  }
}
