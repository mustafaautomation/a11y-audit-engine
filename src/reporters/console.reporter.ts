import { AuditReport, Impact } from '../core/types';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

const IMPACT_COLORS: Record<Impact, string> = {
  critical: RED,
  serious: MAGENTA,
  moderate: YELLOW,
  minor: DIM,
};

export function printReport(report: AuditReport): void {
  const gradeColor = report.grade === 'A' ? GREEN : report.grade <= 'B' ? GREEN : report.grade <= 'C' ? YELLOW : RED;

  console.log();
  console.log(`${BOLD}${CYAN}Accessibility Audit Report${RESET}`);
  console.log(`${DIM}WCAG ${report.wcagLevel} · ${report.timestamp}${RESET}`);
  console.log();

  console.log(`  ${BOLD}Score:${RESET} ${gradeColor}${BOLD}${report.grade}${RESET} ${DIM}(${report.score}%)${RESET}`);
  console.log(
    `  ${BOLD}Pages:${RESET} ${report.summary.totalPages}  ${BOLD}Violations:${RESET} ${report.summary.totalViolations}  ${BOLD}Pass Rate:${RESET} ${(report.summary.passRate * 100).toFixed(1)}%`,
  );
  console.log();

  if (report.summary.totalViolations > 0) {
    console.log(
      `  ${RED}Critical: ${report.summary.criticalCount}${RESET}  ${MAGENTA}Serious: ${report.summary.seriousCount}${RESET}  ${YELLOW}Moderate: ${report.summary.moderateCount}${RESET}  ${DIM}Minor: ${report.summary.minorCount}${RESET}`,
    );
    console.log();
  }

  for (const page of report.pages) {
    const icon = page.violations.length === 0 ? `${GREEN}✓` : `${RED}✗`;
    console.log(
      `  ${icon}${RESET} ${BOLD}${page.url}${RESET}  ${DIM}${page.violations.length} violations · ${page.passes} passes · ${page.scanDuration}ms${RESET}`,
    );

    for (const violation of page.violations.slice(0, 5)) {
      const color = IMPACT_COLORS[violation.impact];
      console.log(
        `    ${color}[${violation.impact}]${RESET} ${violation.help} ${DIM}(${violation.id})${RESET}`,
      );
      console.log(`      ${DIM}${violation.helpUrl}${RESET}`);
    }

    if (page.violations.length > 5) {
      console.log(`    ${DIM}... and ${page.violations.length - 5} more${RESET}`);
    }
  }

  console.log();
}
