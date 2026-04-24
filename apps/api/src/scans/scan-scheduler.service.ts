import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { In, Not } from 'typeorm';

import { ProjectRepository, ScanRepository } from '@db/repositories';

@Injectable()
export class ScanSchedulerService {
  private readonly logger = new Logger(ScanSchedulerService.name);

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly scanRepository: ScanRepository,
    @InjectQueue('scan') private readonly scanQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async triggerDailyScans(): Promise<void> {
    await this.triggerScheduledScans('daily');
  }

  @Cron(CronExpression.EVERY_WEEK)
  async triggerWeeklyScans(): Promise<void> {
    await this.triggerScheduledScans('weekly');
  }

  private async triggerScheduledScans(schedule: 'daily' | 'weekly'): Promise<void> {
    const projects = await this.projectRepository.find({
      where: { scanSchedule: schedule },
    });

    this.logger.log(`Found ${projects.length} projects with ${schedule} schedule`);

    for (const project of projects) {
      const activeScan = await this.scanRepository.findOne({
        where: { projectId: project.id, status: In(['pending', 'running']) },
      });

      if (activeScan) {
        this.logger.log(`Skipping ${project.name} — scan already active`);
        continue;
      }

      const scan = this.scanRepository.create({
        projectId: project.id,
        organizationId: project.organizationId,
        mode: project.scanMode,
        status: 'pending',
        branch: project.defaultBranch,
      });

      const saved = await this.scanRepository.save(scan);

      await this.scanQueue.add(
        'scan.execute',
        {
          scanId: saved.id,
          projectId: project.id,
          organizationId: project.organizationId,
          siteUrl: project.siteUrl,
          repoUrl: project.repoUrl,
          branch: project.defaultBranch,
          docPaths: project.docPaths,
          scanMode: project.scanMode,
          maxPages: project.maxPages,
        },
        { attempts: 1, removeOnComplete: true, removeOnFail: false },
      );

      this.logger.log(`Triggered ${schedule} scan for ${project.name} (${saved.id})`);
    }
  }
}
