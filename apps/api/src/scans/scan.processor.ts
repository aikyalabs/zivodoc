import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { ScanRepository, FindingRepository } from '@db/repositories';
import { FindingEntity } from '@db/entities';
import type { FindingCategory, FindingSeverity } from '@zivodoc/shared';

interface ScanJobPayload {
  scanId: string;
  projectId: string;
  organizationId: string;
  siteUrl?: string | null;
  repoUrl?: string | null;
  branch?: string;
  docPaths?: string[];
  scanMode: string;
  maxPages: number;
}

interface ScannerFinding {
  category: FindingCategory;
  severity: FindingSeverity;
  source: string;
  line: number;
  title: string;
  description: string;
  suggestion?: string;
  rawData?: Record<string, unknown>;
}

interface ScannerResult {
  pagesScanned: number;
  codeBlocksFound: number;
  linksChecked: number;
  findings: ScannerFinding[];
  duration: number;
}

@Injectable()
@Processor('scan')
export class ScanProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly findingRepository: FindingRepository,
  ) {
    super();
  }

  async process(job: Job<ScanJobPayload>): Promise<void> {
    const {
      scanId,
      projectId,
      organizationId,
      siteUrl,
      repoUrl,
      branch,
      docPaths,
      scanMode,
      maxPages,
    } = job.data;
    const startTime = Date.now();

    this.logger.log(`Starting scan ${scanId} for project ${projectId} (mode: ${scanMode})`);

    await this.scanRepository.update(scanId, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      let scanResult: ScannerResult;
      try {
        const scanner = await import('@zivodoc/scanner');
        scanResult = await scanner.scan({
          mode: scanMode as 'site' | 'repo' | 'both',
          siteUrl: siteUrl ?? undefined,
          repoUrl: repoUrl ?? undefined,
          branch,
          docPaths,
          maxPages,
          concurrency: 5,
        });
      } catch (importError) {
        this.logger.warn(`Scanner not available, completing with empty results`);
        scanResult = {
          pagesScanned: 0,
          codeBlocksFound: 0,
          linksChecked: 0,
          findings: [],
          duration: Date.now() - startTime,
        };
      }

      // Bulk insert findings
      if (scanResult.findings.length > 0) {
        const entities = scanResult.findings.map((f: ScannerFinding) => {
          const entity = new FindingEntity();
          entity.scanId = scanId;
          entity.projectId = projectId;
          entity.organizationId = organizationId;
          entity.category = f.category;
          entity.severity = f.severity;
          entity.source = f.source;
          entity.line = f.line ?? 0;
          entity.title = f.title;
          entity.description = f.description;
          entity.suggestion = f.suggestion ?? null;
          entity.status = 'open';
          entity.rawData = f.rawData ?? null;
          return entity;
        });

        for (let i = 0; i < entities.length; i += 100) {
          await this.findingRepository.save(entities.slice(i, i + 100));
        }
      }

      const duration = Date.now() - startTime;

      await this.scanRepository.update(scanId, {
        status: 'completed',
        completedAt: new Date(),
        pagesScanned: scanResult.pagesScanned,
        codeBlocksFound: scanResult.codeBlocksFound,
        linksChecked: scanResult.linksChecked,
        findingsCount: scanResult.findings.length,
        duration,
      });

      this.logger.log(
        `Scan ${scanId} completed: ${scanResult.findings.length} findings in ${duration}ms`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scan ${scanId} failed: ${message}`);

      await this.scanRepository.update(scanId, {
        status: 'failed',
        completedAt: new Date(),
        duration: Date.now() - startTime,
        errorMessage: message,
      });
    }
  }
}
