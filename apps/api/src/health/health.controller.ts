import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Public } from '@src/auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    const timestamp = new Date().toISOString();

    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'ok', version: '0.0.2', timestamp };
    } catch {
      return { status: 'degraded', database: 'unavailable', timestamp };
    }
  }
}
