import { Module } from '@nestjs/common';

import { ProjectsController } from '@src/projects/projects.controller';
import { ProjectsService } from '@src/projects/projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
