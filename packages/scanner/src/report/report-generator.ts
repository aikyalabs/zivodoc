import type { Finding, ScanReport, ScanReportSection, ScanStep, ScanMode } from '../types.js';

interface ReportInput {
  mode: ScanMode;
  url?: string;
  pagesScanned: number;
  linksChecked: number;
  codeBlocksFound: number;
  findings: Finding[];
  steps: ScanStep[];
  durationMs: number;
}

export function generateReport(input: ReportInput): ScanReport {
  const { findings, steps, durationMs } = input;

  const bySeverity = { error: 0, warning: 0, info: 0 };
  const byConfidence = { high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    bySeverity[f.severity]++;
    byConfidence[f.confidence]++;
  }

  const sections = buildSections(findings, steps);

  const report: ScanReport = {
    title: `Scan Report: ${input.url ?? input.mode}`,
    url: input.url,
    generatedAt: new Date().toISOString(),
    durationMs,
    summary: {
      pagesScanned: input.pagesScanned,
      linksChecked: input.linksChecked,
      codeBlocksFound: input.codeBlocksFound,
      totalFindings: findings.length,
      bySeverity,
      byConfidence,
    },
    sections,
    markdown: '',
  };

  report.markdown = renderMarkdown(report);
  return report;
}

function buildSections(findings: Finding[], steps: ScanStep[]): ScanReportSection[] {
  const categoryToStep: Record<string, string> = {
    broken_link: 'check_links',
    broken_anchor: 'check_links',
    redirect_chain: 'check_links',
    slow_link: 'check_links',
    syntax_error: 'check_code',
    empty_code_block: 'check_code',
    missing_code_lang: 'check_code',
    runtime_error: 'check_code',
    type_error: 'check_code',
    leaked_secret: 'check_security',
    insecure_link: 'check_security',
    internal_url: 'check_security',
    missing_page: 'check_structure',
    heading_skip: 'check_structure',
    multiple_h1: 'check_structure',
    empty_section: 'check_structure',
    broken_image: 'check_structure',
    missing_alt_text: 'check_structure',
    todo_left: 'check_content',
    placeholder_text: 'check_content',
    outdated_date: 'check_content',
    duplicate_content: 'check_content',
    stale_ref: 'check_content',
    missing_endpoint: 'check_openapi',
    undocumented_endpoint: 'check_openapi',
    wrong_http_method: 'check_openapi',
  };

  const stepLabels: Record<string, string> = {
    crawl: 'Crawl & Extract',
    check_links: 'Link Verification',
    check_code: 'Code Validation',
    check_security: 'Security Scan',
    check_structure: 'Structure Analysis',
    check_content: 'Content Quality',
    check_openapi: 'OpenAPI Spec Validation',
    report: 'Report Generation',
  };

  const grouped = new Map<string, Finding[]>();
  for (const f of findings) {
    const step = categoryToStep[f.category] ?? 'check_content';
    if (!grouped.has(step)) grouped.set(step, []);
    grouped.get(step)!.push(f);
  }

  const sections: ScanReportSection[] = [];
  for (const step of steps) {
    const stepFindings = grouped.get(step.name) ?? [];
    if (stepFindings.length === 0 && step.status === 'skipped') continue;

    sections.push({
      step: step.name,
      title: stepLabels[step.name] ?? step.name,
      summary: buildStepSummary(step, stepFindings),
      findings: stepFindings,
      stats: {
        duration: step.durationMs ? `${step.durationMs}ms` : 'N/A',
        items: step.itemsProcessed ?? 0,
        findings: stepFindings.length,
      },
    });
  }

  return sections;
}

function buildStepSummary(step: ScanStep, findings: Finding[]): string {
  if (findings.length === 0) {
    return `${step.label}: No issues found. (${step.itemsProcessed ?? 0} items checked)`;
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const infos = findings.filter((f) => f.severity === 'info').length;
  const parts: string[] = [];
  if (errors) parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
  if (warnings) parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  if (infos) parts.push(`${infos} info`);
  return `${step.label}: Found ${parts.join(', ')}. (${step.itemsProcessed ?? 0} items checked)`;
}

function renderMarkdown(report: ScanReport): string {
  const lines: string[] = [];

  lines.push(`# ${report.title}`);
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push(`**Duration:** ${(report.durationMs / 1000).toFixed(1)}s`);
  if (report.url) lines.push(`**URL:** ${report.url}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Pages Scanned | ${report.summary.pagesScanned} |`);
  lines.push(`| Links Checked | ${report.summary.linksChecked} |`);
  lines.push(`| Code Blocks | ${report.summary.codeBlocksFound} |`);
  lines.push(`| **Total Findings** | **${report.summary.totalFindings}** |`);
  lines.push('');

  lines.push('| Severity | Count |');
  lines.push('|----------|-------|');
  lines.push(`| Error | ${report.summary.bySeverity.error} |`);
  lines.push(`| Warning | ${report.summary.bySeverity.warning} |`);
  lines.push(`| Info | ${report.summary.bySeverity.info} |`);
  lines.push('');

  lines.push('| Confidence | Count |');
  lines.push('|------------|-------|');
  lines.push(`| High | ${report.summary.byConfidence.high} |`);
  lines.push(`| Medium | ${report.summary.byConfidence.medium} |`);
  lines.push(`| Low | ${report.summary.byConfidence.low} |`);
  lines.push('');

  for (const section of report.sections) {
    if (section.findings.length === 0) continue;

    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(section.summary);
    lines.push('');

    lines.push('| # | Severity | Confidence | Title | Source | Line |');
    lines.push('|---|----------|------------|-------|--------|------|');

    for (let i = 0; i < section.findings.length; i++) {
      const f = section.findings[i];
      const srcShort = f.source.split('/').pop() ?? f.source;
      lines.push(
        `| ${i + 1} | ${f.severity} | ${f.confidence} | ${escapeMarkdown(f.title)} | ${srcShort} | ${f.line} |`,
      );
    }
    lines.push('');

    lines.push('<details>');
    lines.push('<summary>Details</summary>');
    lines.push('');

    for (const f of section.findings) {
      lines.push(`### ${f.title}`);
      lines.push('');
      lines.push(`- **Source:** \`${f.source}:${f.line}\``);
      lines.push(`- **Severity:** ${f.severity} | **Confidence:** ${f.confidence}`);
      lines.push(`- **Description:** ${f.description}`);
      if (f.suggestion) lines.push(`- **Suggestion:** ${f.suggestion}`);
      if (f.evidence.snippet) lines.push(`- **Evidence:** \`${f.evidence.snippet}\``);
      if (f.evidence.httpStatus) lines.push(`- **HTTP Status:** ${f.evidence.httpStatus}`);
      if (f.evidence.redirectChain) {
        lines.push(`- **Redirect Chain:** ${f.evidence.redirectChain.join(' → ')}`);
      }
      lines.push('');
    }

    lines.push('</details>');
    lines.push('');
  }

  if (report.summary.totalFindings === 0) {
    lines.push('## Result');
    lines.push('');
    lines.push('No issues found. Documentation looks good.');
    lines.push('');
  }

  return lines.join('\n');
}

function escapeMarkdown(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
