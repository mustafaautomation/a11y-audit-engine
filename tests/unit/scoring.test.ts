import { describe, it, expect } from 'vitest';
import { computeScore, buildSummary, buildAxeRunConfig } from '../../src/core/scanner';
import { PageResult, AuditConfig, Violation } from '../../src/core/types';

function makeViolation(impact: Violation['impact']): Violation {
  return {
    id: `rule-${impact}`,
    impact,
    description: `${impact} violation`,
    help: 'Fix it',
    helpUrl: 'https://dequeuniversity.com',
    wcagTags: ['wcag2a'],
    nodes: [{ html: '<div>', target: ['div'], failureSummary: 'Fix' }],
  };
}

function makePage(passes: number, violations: Violation[] = [], incomplete = 0): PageResult {
  return {
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    violations,
    passes,
    incomplete,
    inapplicable: 0,
    scanDuration: 100,
  };
}

describe('computeScore — grade boundaries', () => {
  it('should grade A for 90+ score', () => {
    const page = makePage(95, []);
    const { score, grade } = computeScore([page]);
    expect(score).toBeGreaterThanOrEqual(90);
    expect(grade).toBe('A');
  });

  it('should grade B for 80-89 score', () => {
    // 85 passes, 15 violations (minor, no penalty)
    const violations = Array.from({ length: 15 }, () => makeViolation('minor'));
    const page = makePage(85, violations);
    const { grade } = computeScore([page]);
    expect(grade).toBe('B');
  });

  it('should grade F for 0 pages', () => {
    const { score, grade } = computeScore([]);
    expect(score).toBe(0);
    expect(grade).toBe('F');
  });

  it('should grade F for 0 checks', () => {
    const page = makePage(0, [], 0);
    const { score, grade } = computeScore([page]);
    expect(score).toBe(0);
    expect(grade).toBe('F');
  });

  it('should penalize critical violations', () => {
    const criticals = Array.from({ length: 5 }, () => makeViolation('critical'));
    const page = makePage(90, criticals);
    const { score: penalizedScore } = computeScore([page]);

    const cleanPage = makePage(90, []);
    const { score: cleanScore } = computeScore([cleanPage]);

    expect(penalizedScore).toBeLessThan(cleanScore);
  });

  it('should penalize serious violations', () => {
    const serious = Array.from({ length: 10 }, () => makeViolation('serious'));
    const page = makePage(90, serious);
    const { score } = computeScore([page]);

    // With 10 serious violations: penalty = 10 * 0.05 = 0.5 (max penalty)
    expect(score).toBeLessThan(90);
  });

  it('should cap penalty at 50%', () => {
    const criticals = Array.from({ length: 100 }, () => makeViolation('critical'));
    const page = makePage(200, criticals);
    const { score } = computeScore([page]);

    // Even with massive violations, score should not go below 0
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('buildSummary', () => {
  it('should count violations by impact', () => {
    const page = makePage(10, [
      makeViolation('critical'),
      makeViolation('critical'),
      makeViolation('serious'),
      makeViolation('moderate'),
      makeViolation('minor'),
    ]);

    const summary = buildSummary([page]);

    expect(summary.totalPages).toBe(1);
    expect(summary.totalViolations).toBe(5);
    expect(summary.criticalCount).toBe(2);
    expect(summary.seriousCount).toBe(1);
    expect(summary.moderateCount).toBe(1);
    expect(summary.minorCount).toBe(1);
  });

  it('should aggregate across multiple pages', () => {
    const page1 = makePage(50, [makeViolation('critical')]);
    const page2 = makePage(30, [makeViolation('serious'), makeViolation('moderate')]);

    const summary = buildSummary([page1, page2]);

    expect(summary.totalPages).toBe(2);
    expect(summary.totalViolations).toBe(3);
    expect(summary.criticalCount).toBe(1);
    expect(summary.seriousCount).toBe(1);
  });

  it('should calculate pass rate correctly', () => {
    // 80 passes, 20 violations = 80% pass rate
    const violations = Array.from({ length: 20 }, () => makeViolation('minor'));
    const page = makePage(80, violations);

    const summary = buildSummary([page]);
    expect(summary.passRate).toBeCloseTo(0.8, 1);
  });

  it('should handle empty pages array', () => {
    const summary = buildSummary([]);
    expect(summary.totalPages).toBe(0);
    expect(summary.totalViolations).toBe(0);
    expect(summary.passRate).toBe(0);
  });
});

describe('buildAxeRunConfig', () => {
  it('should build config for Level A', () => {
    const config: AuditConfig = { wcagLevel: 'A', includeBestPractices: false, tags: [] };
    const axeConfig = buildAxeRunConfig(config);

    expect(axeConfig.runOnly.type).toBe('tag');
    expect(axeConfig.runOnly.values).toContain('wcag2a');
    expect(axeConfig.runOnly.values).not.toContain('wcag2aa');
  });

  it('should build config for Level AA', () => {
    const config: AuditConfig = { wcagLevel: 'AA', includeBestPractices: false, tags: [] };
    const axeConfig = buildAxeRunConfig(config);

    expect(axeConfig.runOnly.values).toContain('wcag2a');
    expect(axeConfig.runOnly.values).toContain('wcag2aa');
    expect(axeConfig.runOnly.values).toContain('wcag22aa');
    expect(axeConfig.runOnly.values).not.toContain('wcag2aaa');
  });

  it('should build config for Level AAA', () => {
    const config: AuditConfig = { wcagLevel: 'AAA', includeBestPractices: false, tags: [] };
    const axeConfig = buildAxeRunConfig(config);

    expect(axeConfig.runOnly.values).toContain('wcag2aaa');
    expect(axeConfig.runOnly.values).toContain('wcag21aaa');
  });

  it('should include best practices when enabled', () => {
    const config: AuditConfig = { wcagLevel: 'AA', includeBestPractices: true, tags: [] };
    const axeConfig = buildAxeRunConfig(config);

    expect(axeConfig.runOnly.values).toContain('best-practice');
  });

  it('should use custom tags when provided', () => {
    const config: AuditConfig = {
      wcagLevel: 'AA',
      includeBestPractices: false,
      tags: ['custom-tag-1', 'custom-tag-2'],
    };
    const axeConfig = buildAxeRunConfig(config);

    expect(axeConfig.runOnly.values).toContain('custom-tag-1');
    expect(axeConfig.runOnly.values).toContain('custom-tag-2');
    // Custom tags should override WCAG tags
    expect(axeConfig.runOnly.values).not.toContain('wcag2a');
  });
});
