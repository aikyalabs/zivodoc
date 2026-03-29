import { Module } from '@nestjs/common';

import { RolesController } from '@src/roles/roles.controller';
import { RolesService } from '@src/roles/roles.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
