import { Module } from '@nestjs/common';

import { OrganizationsController } from '@src/organizations/organizations.controller';
import { OrganizationsService } from '@src/organizations/organizations.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
