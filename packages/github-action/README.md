# zivodoc GitHub Action

Scan your documentation for broken links, code errors, and content issues in CI/CD.

## Usage

### Scan docs in your repository

```yaml
name: Docs QA
on: [pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: zivodoc/action@v1
        with:
          mode: repo
          repo-path: docs/
```

### Scan a live docs site

```yaml
- uses: zivodoc/action@v1
  with:
    url: https://docs.example.com
    mode: site
    max-pages: 100
```

### Scan both repo and live site

```yaml
- uses: zivodoc/action@v1
  with:
    url: https://docs.example.com
    mode: both
    repo-path: docs/
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `url` | Docs site URL to scan | - |
| `repo-path` | Path to docs in the repo | `docs/` |
| `mode` | Scan mode: `site`, `repo`, or `both` | `repo` |
| `max-pages` | Max pages to crawl | `500` |
| `fail-on-error` | Fail CI if errors found | `true` |
| `comment-on-pr` | Post findings as PR comment | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `total-findings` | Total findings count |
| `errors` | Error-severity count |
| `warnings` | Warning-severity count |
| `report` | Path to markdown report file |
