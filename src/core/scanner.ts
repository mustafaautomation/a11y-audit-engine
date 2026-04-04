import { AuditConfig, PageResult, Violation, ViolationNode, DEFAULT_CONFIG } from './types';

interface AxeViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface AxeResults {
  violations: AxeViolation[];
  passes: Array<{ id: string }>;
  incomplete: Array<{ id: string }>;
  inapplicable: Array<{ id: string }>;
}

function getWcagTags(level: string): string[] {
  const tags = ['wcag2a', 'wcag21a'];
  if (level === 'AA' || level === 'AAA') {
    tags.push('wcag2aa', 'wcag21aa', 'wcag22aa');
  }
  if (level === 'AAA') {
    tags.push('wcag2aaa', 'wcag21aaa');
  }
  return tags;
}

export function buildAxeRunConfig(config: AuditConfig): {
  runOnly: { type: string; values: string[] };
} {
  const tags = config.tags.length > 0 ? config.tags : getWcagTags(config.wcagLevel);
  if (config.includeBestPractices) {
    tags.push('best-practice');
  }
  return { runOnly: { type: 'tag', values: tags } };
}

export function parseAxeResults(url: string, axeResults: AxeResults, duration: number): PageResult {
  const violations: Violation[] = axeResults.violations.map((v) => ({
    id: v.id,
    impact: v.impact as Violation['impact'],
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    wcagTags: v.tags.filter((t) => t.startsWith('wcag')),
    nodes: v.nodes.map(
      (n): ViolationNode => ({
        html: n.html,
        target: n.target.map(String),
        failureSummary: n.failureSummary,
      }),
    ),
  }));

  return {
    url,
    timestamp: new Date().toISOString(),
    violations,
    passes: axeResults.passes.length,
    incomplete: axeResults.incomplete.length,
    inapplicable: axeResults.inapplicable.length,
    scanDuration: duration,
  };
}

export function computeScore(pages: PageResult[]): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
} {
  if (pages.length === 0) {
    return { score: 0, grade: 'F' };
  }

  const totalChecks = pages.reduce(
    (sum, p) => sum + p.passes + p.violations.length + p.incomplete,
    0,
  );
  const totalPasses = pages.reduce((sum, p) => sum + p.passes, 0);

  if (totalChecks === 0) {
    return { score: 0, grade: 'F' };
  }

  // Base score from pass rate
  const passRate = totalPasses / totalChecks;

  // Penalty for critical/serious violations
  const criticalCount = pages.reduce(
    (sum, p) => sum + p.violations.filter((v) => v.impact === 'critical').length,
    0,
  );
  const seriousCount = pages.reduce(
    (sum, p) => sum + p.violations.filter((v) => v.impact === 'serious').length,
    0,
  );

  const penalty = Math.min(criticalCount * 0.1 + seriousCount * 0.05, 0.5);
  const score = Math.max(0, Math.round((passRate - penalty) * 100));

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade };
}

export function buildSummary(pages: PageResult[]) {
  const allViolations = pages.flatMap((p) => p.violations);
  return {
    totalPages: pages.length,
    totalViolations: allViolations.length,
    criticalCount: allViolations.filter((v) => v.impact === 'critical').length,
    seriousCount: allViolations.filter((v) => v.impact === 'serious').length,
    moderateCount: allViolations.filter((v) => v.impact === 'moderate').length,
    minorCount: allViolations.filter((v) => v.impact === 'minor').length,
    passRate:
      pages.length > 0
        ? pages.reduce((s, p) => s + p.passes, 0) /
          Math.max(
            pages.reduce((s, p) => s + p.passes + p.violations.length + p.incomplete, 0),
            1,
          )
        : 0,
  };
}

export { DEFAULT_CONFIG };
