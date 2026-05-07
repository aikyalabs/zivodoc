import { MigrationInterface, QueryRunner } from 'typeorm';

const EMBEDDING_DIMENSIONS = 384;

export class InitialSchema1746662400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "name" varchar(200) NOT NULL,
        "slug" varchar(100) NOT NULL UNIQUE,
        "plan" varchar(20) NOT NULL DEFAULT 'free',
        "scanQuota" int NOT NULL DEFAULT 3,
        "scansUsedThisMonth" int NOT NULL DEFAULT 0,
        "maxPages" int NOT NULL DEFAULT 500,
        "maxProjects" int NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_organizations_slug" ON "organizations" ("slug")`,
    );

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "name" varchar(100) NOT NULL,
        "description" varchar(500),
        "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "organizationId" varchar(50) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_roles_name_org" ON "roles" ("name", "organizationId")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_roles_org" ON "roles" ("organizationId")`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "googleId" varchar(100) UNIQUE,
        "avatar" varchar(500),
        "onboardingCompleted" boolean NOT NULL DEFAULT false,
        "role" varchar(50) NOT NULL DEFAULT 'member',
        "isDisabled" boolean NOT NULL DEFAULT false,
        "organizationId" varchar(50) REFERENCES "organizations"("id") ON DELETE CASCADE,
        "roleId" varchar(50) REFERENCES "roles"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_google_id" ON "users" ("googleId") WHERE "googleId" IS NOT NULL`,
    );
    await queryRunner.query(`CREATE INDEX "idx_users_org" ON "users" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("roleId")`);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "token" varchar(128) PRIMARY KEY,
        "userId" varchar(50) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_sessions_user" ON "sessions" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_sessions_expires" ON "sessions" ("expiresAt")`);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "actorId" varchar(50),
        "organizationId" varchar(50),
        "method" varchar(10) NOT NULL,
        "path" varchar(500) NOT NULL,
        "action" varchar(200) NOT NULL,
        "statusCode" int NOT NULL,
        "ipAddress" varchar(50),
        "userAgent" varchar(500),
        "metadata" jsonb,
        "duration" int NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_audit_actor" ON "audit_logs" ("actorId")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_action" ON "audit_logs" ("action")`);

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "name" varchar(200) NOT NULL,
        "siteUrl" varchar(500),
        "repoUrl" varchar(500),
        "defaultBranch" varchar(100) NOT NULL DEFAULT 'main',
        "docPaths" jsonb NOT NULL DEFAULT '["docs/","README.md"]'::jsonb,
        "scanMode" varchar(10) NOT NULL DEFAULT 'site',
        "maxPages" int NOT NULL DEFAULT 500,
        "scanSchedule" varchar(10) NOT NULL DEFAULT 'manual',
        "openapiSpecUrl" varchar(500),
        "organizationId" varchar(50) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_projects_org" ON "projects" ("organizationId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_projects_repo_org" ON "projects" ("repoUrl", "organizationId") WHERE "repoUrl" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_projects_site_org" ON "projects" ("siteUrl", "organizationId") WHERE "siteUrl" IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "scans" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "projectId" varchar(50) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "organizationId" varchar(50) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "mode" varchar(10) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "branch" varchar(100),
        "commitSha" varchar(40),
        "pagesScanned" int NOT NULL DEFAULT 0,
        "codeBlocksFound" int NOT NULL DEFAULT 0,
        "linksChecked" int NOT NULL DEFAULT 0,
        "findingsCount" int NOT NULL DEFAULT 0,
        "duration" int,
        "triggerSource" varchar(20) NOT NULL DEFAULT 'manual',
        "errorMessage" text,
        "steps" jsonb,
        "startedAt" timestamp,
        "completedAt" timestamp
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_scans_project" ON "scans" ("projectId")`);
    await queryRunner.query(`CREATE INDEX "idx_scans_org" ON "scans" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "idx_scans_status" ON "scans" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "findings" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "scanId" varchar(50) NOT NULL REFERENCES "scans"("id") ON DELETE CASCADE,
        "projectId" varchar(50) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "organizationId" varchar(50) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "category" varchar(30) NOT NULL,
        "severity" varchar(10) NOT NULL,
        "source" varchar(500) NOT NULL,
        "line" int NOT NULL DEFAULT 0,
        "title" varchar(300) NOT NULL,
        "description" text NOT NULL,
        "suggestion" text,
        "status" varchar(20) NOT NULL DEFAULT 'open',
        "rawData" jsonb,
        "fingerprint" varchar(100) NOT NULL DEFAULT '',
        "firstSeenScanId" varchar(50) NOT NULL DEFAULT '',
        "lastSeenScanId" varchar(50) NOT NULL DEFAULT '',
        "seenCount" int NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_findings_scan" ON "findings" ("scanId")`);
    await queryRunner.query(`CREATE INDEX "idx_findings_project" ON "findings" ("projectId")`);
    await queryRunner.query(`CREATE INDEX "idx_findings_org" ON "findings" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "idx_findings_category" ON "findings" ("category")`);
    await queryRunner.query(`CREATE INDEX "idx_findings_severity" ON "findings" ("severity")`);
    await queryRunner.query(`CREATE INDEX "idx_findings_status" ON "findings" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_findings_fingerprint_project" ON "findings" ("fingerprint", "projectId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "name" varchar(100) NOT NULL,
        "hashedKey" varchar(64) NOT NULL UNIQUE,
        "prefix" varchar(8) NOT NULL,
        "userId" varchar(50) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "organizationId" varchar(50),
        "lastUsedAt" timestamp,
        "expiresAt" timestamp,
        "isActive" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_api_keys_user" ON "api_keys" ("userId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_api_keys_hash" ON "api_keys" ("hashedKey")`);

    await queryRunner.query(`
      CREATE TABLE "github_installations" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "installationId" int NOT NULL UNIQUE,
        "accountLogin" varchar(100) NOT NULL,
        "accountType" varchar(20) NOT NULL,
        "accountAvatarUrl" varchar(500),
        "organizationId" varchar(50) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "installedById" varchar(50) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "permissions" jsonb,
        "repositorySelection" varchar(20) NOT NULL DEFAULT 'selected',
        "suspendedAt" timestamp
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_gh_installations_iid" ON "github_installations" ("installationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_gh_installations_org" ON "github_installations" ("organizationId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "github_repo_links" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "installationId" int NOT NULL,
        "repoId" int NOT NULL,
        "repoFullName" varchar(200) NOT NULL,
        "repoDefaultBranch" varchar(100) NOT NULL DEFAULT 'main',
        "repoPrivate" boolean NOT NULL DEFAULT false,
        "projectId" varchar(50) NOT NULL UNIQUE REFERENCES "projects"("id") ON DELETE CASCADE,
        "organizationId" varchar(50) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "webhookEnabled" boolean NOT NULL DEFAULT true,
        "checkRunsEnabled" boolean NOT NULL DEFAULT true,
        "prCommentsEnabled" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_gh_repo_links_project" ON "github_repo_links" ("projectId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_gh_repo_links_repo_org" ON "github_repo_links" ("repoId", "organizationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_gh_repo_links_installation" ON "github_repo_links" ("installationId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "ai_provider_keys" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "organizationId" varchar(50) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "provider" varchar(20) NOT NULL,
        "model" varchar(50) NOT NULL,
        "encryptedKey" text NOT NULL,
        "keyPreview" varchar(12) NOT NULL,
        "lastUsedAt" timestamp,
        "lastVerifiedAt" timestamp,
        "createdByUserId" varchar(100)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_ai_keys_org_provider" ON "ai_provider_keys" ("organizationId", "provider")`,
    );

    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "projectId" varchar(50) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "ipHash" varchar(64) NOT NULL,
        "origin" varchar(500),
        "pageUrl" varchar(500),
        "messageCount" int NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_chat_sessions_project" ON "chat_sessions" ("projectId")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_chat_sessions_ip" ON "chat_sessions" ("ipHash")`);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "sessionId" varchar(50) NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
        "projectId" varchar(50) NOT NULL,
        "role" varchar(20) NOT NULL,
        "content" text NOT NULL,
        "citations" jsonb,
        "retrievedChunkIds" jsonb,
        "promptTokens" int NOT NULL DEFAULT 0,
        "completionTokens" int NOT NULL DEFAULT 0,
        "latencyMs" int NOT NULL DEFAULT 0,
        "lowConfidence" boolean NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_session" ON "chat_messages" ("sessionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_project" ON "chat_messages" ("projectId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "chat_chunks" (
        "id" varchar(50) PRIMARY KEY,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "projectId" varchar(50) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "source" varchar(500) NOT NULL,
        "anchor" varchar(500),
        "headingPath" varchar(500),
        "content" text NOT NULL,
        "tokenCount" int NOT NULL DEFAULT 0,
        "embedding" vector(${EMBEDDING_DIMENSIONS}) NOT NULL,
        "scanId" varchar(50) NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_chat_chunks_project" ON "chat_chunks" ("projectId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_chunks_embedding_hnsw" ON "chat_chunks" USING hnsw (embedding vector_cosine_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_chunks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_provider_keys"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "github_repo_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "github_installations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "findings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
  }
}
