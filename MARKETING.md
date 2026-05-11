# zivodoc — Marketing & Session Plan

_Snapshot date: 2026-05-11_

## Where we are right now

**Product status:** free tier live at `zivodoc.com` (landing) + `app.zivodoc.com` (web app). API on Dokploy/Traefik. Three Cloudflare Pages projects: `zivodoc` (landing), `zivodoc-app` (web), `zivodoc-cdn` (chat widget).

**What ships today (honest list):**
- Site crawl + repo clone, markdown + code-block extraction
- JavaScript runtime execution in QuickJS WASM sandbox (catches `ReferenceError`, `TypeError`, runtime crashes)
- JS / TS syntax validation via `acorn`
- JSON / YAML syntax validation via `JSON.parse` + `js-yaml`
- Dead-link, redirect-chain, and broken-anchor detection
- OpenAPI spec validation (3.0, 3.1, Swagger 2.0)
- Pattern-based secret detection
- Structure checks (heading skips, multiple H1, missing alt text, broken images)
- Content hygiene (TODO markers, placeholder text, stale dates)
- GitHub App: PR check status + sticky comment with file/line context
- GitHub Action + CLI for any CI provider
- Dashboard with cross-scan finding reconciliation (resolve/ignore carries forward)
- Scheduled scans (daily / weekly / manual)
- CSV export of findings
- Admin panel (Tier 1+2): users, orgs with detail sheet, scans cross-org, sessions, GitHub installations, AI keys, audit logs, queue summary

**What we explicitly do NOT ship yet** (landing now reflects this honestly):
- Multi-language execution (Python / Go / Ruby / cURL) — JS-only WASM sandbox today
- Dependency installation in sandbox
- Output verification against documented expectations
- AI contradiction / drift / tone analysis (entity + key storage exist; no scan-pipeline step yet)
- Auto-fix PR generation (GitHub App posts checks + comments, not PRs)
- TypeScript type-checking (just syntax today)

**Tier 3 admin features deferred:** impersonation, Stripe, GDPR data export, announcements, manual scan trigger, BullBoard mount.

## Recent session work (what just shipped — 2026-05-10 → 11)

1. **Landing honesty pass** (`6fa540c`) — dropped fabricated testimonials, reframed Code Execution/AI Analysis/Auto-Fix PRs to match shipped reality, fixed hero `fix`→`report` tab, hid unconfirmed `$29/$79` pricing behind "coming soon", replaced unsourced stats with concrete capabilities, added FAQPage + BlogPosting JSON-LD, og:image:alt, jsonLd-as-array support in `Layout.astro`.
2. **Scanner JSON/YAML validation** (`5556fb3`) — `JSON.parse` + `js-yaml`, reuses existing `syntax_error` category (no enum/UI changes downstream), property-fragment skip via string indexing (no regex).
3. **Cursor + auto-fix leftovers** (`76c6fde`) — `CustomCursor` no longer flashes at top-left on load (skip render until `isVisible`, `initial={false}` on motion divs). `ScanVisual` rewritten from "PRs generated" → "PR check + sticky comment + dashboard". `Solution` step 3 rewritten. Dashboard bottom-bar "Auto-fix all" → "Open in dashboard". Hero stat "PRs opened" → "Dead links". Removed `80% of docs sites` fabricated stat from `Problem`.
4. **Hero mobile clipping fix** (`9966fdc`) — `min-w-0` on hero grid items so the terminal's `whitespace-pre` long lines can't force the grid wider than the viewport.
5. **CI deploy gate permanent fix** (`58cd173`) — replaced `needs.ci_pass.result == 'success'` with built-in `success()` in all 4 deploy jobs. The result-string-compare was hitting an intermittent race with `if: always()` upstream jobs and causing deploys to silently skip on `push` triggers (e.g., run `25650735218` skipped all deploys twice; workflow_dispatch on same SHA deployed clean).
6. **Google Analytics 4** (`<G-97ML2HZFRW>` — most recent) — added gtag to `apps/web/index.html` and `apps/landing/src/layouts/Layout.astro` (uses `is:inline` so Astro doesn't bundle the snippet).

## Analytics setup checklist

After the GA4 deploy lands:

- [ ] Verify in `GA → Realtime → Overview` from an incognito tab on both `zivodoc.com` and `app.zivodoc.com`. Look for sessions within ~30 seconds.
- [ ] Cross-domain tracking: in `Admin → Data Streams → web → Configure tag settings → Configure your domains`, add **both** `zivodoc.com` and `app.zivodoc.com` so the `cid` cookie spans the funnel.
- [ ] Mark these GA events as conversions: `page_view` on `/login`, `sign_up`, `scan_completed`.
- [ ] Wire `gtag('event', 'sign_up', { method: 'google' | 'email_otp' })` into the auth callback (web app, post-OAuth success). _Pending — not yet implemented._
- [ ] Wire `gtag('event', 'scan_completed', { findings_count: N, severity_max: 'error' | 'warning' | 'info' })` when a scan finishes in the dashboard. _Pending — activation metric, not yet implemented._
- [ ] After 2 weeks of traffic: review funnel `landing → /login → sign_up → scan_completed`. The biggest drop-off is your highest-leverage fix.

**Activation metric:** `scan_completed` with `findings_count ≥ 1` for a new user. Every marketing experiment is judged against moving that number.

## 30-day marketing plan

### Week 1 — instrument

- Land GA4 (done) and verify funnel.
- Add a public "share this scan" URL (token-gated, read-only) so users can broadcast their scan results — every share is free distribution. _Pending._
- Pick the single activation metric above and surface it on the admin overview.

### Week 2 — public launches

- **Show HN:** "Show HN: zivodoc — JavaScript runtime checking for your docs." Tuesday 8am PT. The hook is the WASM sandbox, not the dashboard. Author replying actively for 4h.
- **Product Hunt:** schedule ~2 weeks out; find a hunter with PH following to launch on our behalf. Reach out to 5 candidates this week.
- **Reddit:** one post each in `/r/programming`, `/r/webdev`, `/r/devops`, `/r/sre`. Lead with a blog post (e.g., "We executed every code example on Stripe's docs — here's what we found"), product mentioned para 3. Space the posts across the week.
- **dev.to + Hashnode crossposts** of the existing 3 blog posts. `canonical` URL pointing back to zivodoc.com to keep SEO juice.

### Week 3 — cold outreach (highest-ROI lever)

Target: DevRel leads, heads of docs, eng leads at API-first companies.

30-company list to scan-and-email:
> Resend, Supabase, Clerk, Neon, Liveblocks, Modal, Cal.com, Pinecone, Inngest, Trigger.dev, Convex, Linear, Vercel, Railway, Fly.io, PlanetScale, Turso, Bun, Deno, Lovable, Replicate, Together, Anthropic, OpenAI, Hugging Face, Mintlify, Docusaurus, Stripe, Twilio, SendGrid.

**Process:**
1. Run zivodoc scanner against each company's public docs first.
2. Cold email to DevRel lead leading with their *own* findings: "I scanned your docs at <URL>. Found N broken examples, M API mismatches, K dead links. Full report: <share-link>. Want me to wire this into your CI? Free tier."
3. Expected reply rate when the email leads with their broken docs: 30–40%.

### Week 4 — SEO compounds

1 blog post per week on long-tail keywords:
- "How to test code examples in Docusaurus / Nextra / Mintlify" (one post per tool)
- "Validating OpenAPI specs against your published docs"
- "Why your getting-started guide is silently broken (and how to detect it)"
- "Detecting leaked API keys in your public documentation"
- "How Stripe / Supabase / Vercel keep their docs from drifting" — observational case studies, no permission needed

**Plus:**
- Open-source bait repo: `docs-qa-rules` with public list of finding categories + detection logic. Backlinks to zivodoc.com. Don't open-source the whole scanner — keep the moat.
- Submit `packages/github-action` to the GitHub Marketplace (polish README, screenshots).

### Always-on channels

- **Write the Docs Slack**, **Docusaurus / Vercel / Supabase Discords** — answer docs-testing questions, mention zivodoc when genuinely relevant. Slow burn.
- **Twitter alerts** for "docs broken", "documentation outdated", "found a bug in the docs" — reply with a scan output for their docs site.

### Don't do yet

- ❌ Paid ads (Twitter/Google) — no conversion signal yet
- ❌ Hire a marketer / agency — too early
- ❌ Conferences / sponsorships — months of lead time
- ❌ "Founder content" on LinkedIn — wrong audience for dev tools

## Suggested order of operations

1. Verify GA4 (10 min — manual)
2. Wire `sign_up` + `scan_completed` events (~15 min total)
3. Build the "share scan" public URL (~half day)
4. Run scanner against the 30-company list, build per-company report links (~2 hours scripted)
5. Send 30 personalized cold emails over 3 days
6. **Then** Show HN, Product Hunt, Reddit, dev.to crossposts
7. Sustain 1 SEO blog post per week from Week 4 onward

## Key memory references

- `~/.claude/projects/-Users-ritesh-Desktop-workspace-zivodoc/memory/project_session_state.md` — broader product state snapshot
- `~/.claude/projects/-Users-ritesh-Desktop-workspace-zivodoc/memory/feedback_ci_hyphen_gotcha.md` — Actions hyphen-in-`needs` parser bug (root cause of earlier deploy skips — now permanently mitigated via `success()`)
- `~/.claude/projects/-Users-ritesh-Desktop-workspace-zivodoc/memory/feedback_design.md` — dark monochrome / boxy / Linear+Warp inspired
- `~/.claude/projects/-Users-ritesh-Desktop-workspace-zivodoc/memory/project_errata_vision.md` — product vision, business model, GTM, competitive positioning
