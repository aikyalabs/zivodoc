# zivodoc

**Automated QA for developer documentation.**

zivodoc finds broken code examples, dead links, stale API references, and leaked secrets in your docs, and reports them in CI and a dashboard before your users find them.

Docs rot quietly after every code change. zivodoc scans your docs site or repo continuously so you catch it first.

[Website](https://zivodoc.com) · [App](https://app.zivodoc.com) · [MIT License](LICENSE)

## What it checks

| Area | Checks |
|------|--------|
| **Code examples** | JS runs in a sandbox (QuickJS WASM) to catch runtime errors, JS/TS syntax validation, JSON/YAML parsing, empty blocks, missing language tags |
| **Links** | Dead links, broken anchors, redirect chains, slow links, insecure `http://` links, broken images |
| **API references** | OpenAPI 3.0 / 3.1 / Swagger 2.0 drift: missing endpoints, undocumented endpoints, wrong HTTP methods |
| **Security** | Leaked API keys and tokens, internal or staging URLs exposed in docs |
| **Structure** | Heading level skips, multiple H1s, empty sections, missing alt text |
| **Content** | TODOs left in, placeholder text, outdated dates, duplicate content |

Each finding includes a severity, a confidence score, and evidence (file, line, and the offending snippet). Findings are tracked across scans, so fixed issues auto-resolve and regressions get flagged.

## How you can use it

- **Dashboard**: hosted at [app.zivodoc.com](https://app.zivodoc.com), or self-host it (see below). Scheduled scans, finding history, CSV export.
- **CLI**: run a scan locally or in any CI provider. Exits non-zero on error-severity findings.
- **GitHub Action**: scans on every PR and posts a sticky comment with the findings.

> The CLI and GitHub Action aren't published to npm / the Marketplace yet. For now, run the CLI from source.

### CLI (from source)

```bash
pnpm install
pnpm --filter @zivodoc/shared build
pnpm --filter @zivodoc/scanner build
pnpm --filter @zivodoc/cli build

node packages/cli/dist/index.js scan --url https://docs.example.com
node packages/cli/dist/index.js scan --repo https://github.com/org/repo --doc-paths docs
node packages/cli/dist/index.js scan --url https://docs.example.com --json   # for CI
```

## Self-hosting / local development

**Prerequisites:** Node.js 22+, pnpm 10+, Docker

```bash
# 1. Start Postgres + Redis
docker compose up -d

# 2. Install and build
pnpm install
pnpm build

# 3. Configure env
cp apps/api/.env.template apps/api/.env
cp apps/web/.env.template apps/web/.env

# 4. Set up the database
pnpm --filter @zivodoc/api migration:run
pnpm --filter @zivodoc/api seed

# 5. Run
pnpm dev
```

- API: http://localhost:3000
- Web: http://localhost:5173

**Signing in:** zivodoc uses Google OAuth or an email code. Set the Google OAuth or AWS SES values in `apps/api/.env`. Without SES, you can grab the code straight from Redis in local dev:

```bash
docker compose exec redis redis-cli get otp:admin@example.com
```

## Project structure

```
apps/
  api/        NestJS API: auth, projects, scans (BullMQ), findings, GitHub App
  web/        React dashboard: TanStack Router + Query, Tailwind
  landing/    Astro marketing site
packages/
  scanner/        Core engine: crawling, code execution, link/OpenAPI/content checks
  cli/            `zivodoc` CLI
  github-action/  Composite GitHub Action
  shared/         Zod schemas and types shared by API and web
```

## Stack

| Layer | Technology |
|-------|-----------|
| Scanner | Crawlee (Cheerio + Playwright), QuickJS WASM, acorn |
| API | NestJS 11, TypeORM, PostgreSQL 17, BullMQ + Redis |
| Web | React 19, Vite, TanStack Router/Query, Radix UI, Tailwind CSS 4 |
| Shared | Zod schemas, tsup builds |
| Tooling | pnpm workspaces, Turborepo, Vitest, Jest |

## Testing

```bash
pnpm --filter @zivodoc/scanner test
pnpm --filter @zivodoc/web test
pnpm --filter @zivodoc/api test:e2e
```

## Contributing

Issues and PRs are welcome. If you're planning something big, open an issue first so we can talk it through.

Found a security issue? Please don't open a public issue. Report it privately through [GitHub security advisories](https://github.com/aikyalabs/zivodoc/security/advisories/new).

## License

[MIT](LICENSE)
