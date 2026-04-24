import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { In, Not } from 'typeorm';

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
  confidence: string;
  source: string;
  line: number;
  title: string;
  description: string;
  suggestion?: string;
  evidence?: Record<string, unknown>;
}

interface ScannerResult {
  pagesScanned: number;
  codeBlocksFound: number;
  linksChecked: number;
  findings: ScannerFinding[];
  steps: unknown[];
  report: { markdown: string; summary: Record<string, unknown> };
  duration: number;
}

/** Fingerprint uses category + normalized source path + line — title-independent so minor wording changes don't create duplicate findings */
function generateFingerprint(finding: ScannerFinding): string {
  let source = finding.source;
  try {
    const url = new URL(source);
    source = url.pathname.replace(/\/$/, '');
  } catch {
    // file path — normalize slashes
    source = source.replace(/\\/g, '/');
  }

  return `${finding.category}|${source}|${finding.line}`;
}

@Injectable()
@Processor('scan', { lockDuration: 900_000 })
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

    await this.scanRepository.update(scanId, { status: 'running', startedAt: new Date() });

    try {
      const scanResult = await this.runScanner({
        siteUrl,
        repoUrl,
        branch,
        docPaths,
        scanMode,
        maxPages,
        startTime,
      });

      if (scanResult.pagesScanned === 0 && scanResult.findings.length === 0) {
        await this.scanRepository.update(scanId, {
          status: 'failed',
          completedAt: new Date(),
          duration: Date.now() - startTime,
          errorMessage:
            'Scanner produced no results. The site may be unreachable or require authentication.',
        });
        return;
      }

      const reconciled = await this.reconcileFindings(
        scanResult.findings,
        scanId,
        projectId,
        organizationId,
      );

      await this.scanRepository.update(scanId, {
        status: 'completed',
        completedAt: new Date(),
        pagesScanned: scanResult.pagesScanned,
        codeBlocksFound: scanResult.codeBlocksFound,
        linksChecked: scanResult.linksChecked,
        findingsCount: reconciled.open,
        duration: Date.now() - startTime,
      });

      this.logger.log(
        `Scan ${scanId}: ${reconciled.created} new, ${reconciled.carried} carried, ${reconciled.autoResolved} fixed, ${reconciled.reopened} regressions`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scan ${scanId} failed: ${message}`);

      // Clean up any partial findings created during this scan
      await this.findingRepository.delete({ scanId, firstSeenScanId: scanId }).catch(() => {});

      await this.scanRepository.update(scanId, {
        status: 'failed',
        completedAt: new Date(),
        duration: Date.now() - startTime,
        errorMessage: message,
      });
    }
  }

  private async runScanner(params: {
    siteUrl?: string | null;
    repoUrl?: string | null;
    branch?: string;
    docPaths?: string[];
    scanMode: string;
    maxPages: number;
    startTime: number;
  }): Promise<ScannerResult> {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const scanner = await dynamicImport('@zivodoc/scanner');
    return scanner.scan({
      mode: params.scanMode as 'site' | 'repo' | 'both',
      siteUrl: params.siteUrl ?? undefined,
      repoUrl: params.repoUrl ?? undefined,
      branch: params.branch,
      docPaths: params.docPaths,
      maxPages: params.maxPages,
      concurrency: 5,
    });
  }

  /**
   * Match new findings against existing project findings by fingerprint.
   * Carries forward user decisions (resolve/ignore), detects regressions,
   * and auto-resolves findings no longer detected.
   */
  private async reconcileFindings(
    newFindings: ScannerFinding[],
    scanId: string,
    projectId: string,
    organizationId: string,
  ): Promise<{
    created: number;
    carried: number;
    autoResolved: number;
    reopened: number;
    open: number;
  }> {
    const newByFingerprint = new Map<string, ScannerFinding>();
    for (const finding of newFindings) {
      const fp = generateFingerprint(finding);
      if (!newByFingerprint.has(fp)) newByFingerprint.set(fp, finding);
    }

    const existingFindings = await this.findingRepository.find({
      where: { projectId, status: Not(In(['auto_resolved'])) },
    });

    const existingByFingerprint = new Map<string, FindingEntity>();
    for (const finding of existingFindings) {
      if (finding.fingerprint) existingByFingerprint.set(finding.fingerprint, finding);
    }

    let created = 0;
    let carried = 0;
    let reopened = 0;
    const toCreate: FindingEntity[] = [];
    const toUpdate: Array<{ id: string; data: Record<string, unknown> }> = [];

    for (const [fp, finding] of newByFingerprint) {
      const match = existingByFingerprint.get(fp);

      if (match) {
        const baseUpdate = { lastSeenScanId: scanId, seenCount: match.seenCount + 1 };
        const freshData = {
          description: finding.description,
          title: finding.title,
          suggestion: finding.suggestion ?? null,
          rawData: { confidence: finding.confidence, evidence: finding.evidence ?? null },
        };

        if (match.status === 'ignored') {
          toUpdate.push({ id: match.id, data: baseUpdate });
          carried++;
        } else if (match.status === 'resolved') {
          toUpdate.push({
            id: match.id,
            data: { ...baseUpdate, ...freshData, status: 'reopened', scanId },
          });
          reopened++;
        } else {
          toUpdate.push({
            id: match.id,
            data: { ...baseUpdate, ...freshData, severity: finding.severity },
          });
          carried++;
        }

        existingByFingerprint.delete(fp);
      } else {
        const entity = new FindingEntity();
        entity.scanId = scanId;
        entity.projectId = projectId;
        entity.organizationId = organizationId;
        entity.category = finding.category;
        entity.severity = finding.severity;
        entity.source = finding.source;
        entity.line = finding.line ?? 0;
        entity.title = finding.title;
        entity.description = finding.description;
        entity.suggestion = finding.suggestion ?? null;
        entity.status = 'open';
        entity.rawData = { confidence: finding.confidence, evidence: finding.evidence ?? null };
        entity.fingerprint = fp;
        entity.firstSeenScanId = scanId;
        entity.lastSeenScanId = scanId;
        entity.seenCount = 1;
        toCreate.push(entity);
        created++;
      }
    }

    const autoResolveIds = [...existingByFingerprint.values()]
      .filter((f) => f.status === 'open' || f.status === 'reopened')
      .map((f) => f.id);

    // Batch write
    for (let i = 0; i < toCreate.length; i += 100) {
      await this.findingRepository.save(toCreate.slice(i, i + 100));
    }
    for (const { id, data } of toUpdate) {
      await this.findingRepository.update(id, data);
    }
    if (autoResolveIds.length > 0) {
      await this.findingRepository.update(autoResolveIds, { status: 'auto_resolved' } as Record<
        string,
        unknown
      >);
    }

    const open = await this.findingRepository.count({
      where: { projectId, status: In(['open', 'reopened']) },
    });

    return { created, carried, autoResolved: autoResolveIds.length, reopened, open };
  }
}
