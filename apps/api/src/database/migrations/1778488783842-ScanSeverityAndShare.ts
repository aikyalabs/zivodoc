import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScanSeverityAndShare1778488783842 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scans" ADD "errorCount" int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "scans" ADD "warningCount" int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "scans" ADD "infoCount" int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "scans" ADD "shareToken" varchar(64) NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_scans_share_token" ON "scans" ("shareToken") WHERE "shareToken" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_scans_share_token"`);
    await queryRunner.query(`ALTER TABLE "scans" DROP COLUMN "shareToken"`);
    await queryRunner.query(`ALTER TABLE "scans" DROP COLUMN "infoCount"`);
    await queryRunner.query(`ALTER TABLE "scans" DROP COLUMN "warningCount"`);
    await queryRunner.query(`ALTER TABLE "scans" DROP COLUMN "errorCount"`);
  }
}
