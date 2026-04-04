import { describe, it, expect } from 'vitest';
import { A11yAuditor } from '../../src/core/auditor';

describe('A11yAuditor', () => {
  it('should produce a report from parsed results', () => {
    const auditor = new A11yAuditor({ wcagLevel: 'AA' });

    auditor.parseResults(
      'https://example.com',
      {
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Color contrast issue',
            help: 'Ensure sufficient contrast',
            helpUrl: 'https://example.com/help',
            tags: ['wcag2aa'],
            nodes: [{ html: '<span>text</span>', target: ['span'], failureSummary: 'Fix it' }],
          },
        ],
        passes: [{ id: 'document-title' }, { id: 'html-lang-valid' }],
        incomplete: [],
        inapplicable: [],
      },
      1200,
    );

    const report = auditor.getReport();

    expect(report.wcagLevel).toBe('AA');
    expect(report.pages).toHaveLength(1);
    expect(report.summary.totalViolations).toBe(1);
    expect(report.summary.seriousCount).toBe(1);
    expect(report.score).toBeDefined();
    expect(report.grade).toMatch(/^[ABCDF]$/);
  });

  it('should produce perfect score with no violations', () => {
    const auditor = new A11yAuditor();

    auditor.parseResults(
      'https://example.com',
      {
        violations: [],
        passes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        incomplete: [],
        inapplicable: [],
      },
      500,
    );

    const report = auditor.getReport();
    expect(report.score).toBe(100);
    expect(report.grade).toBe('A');
  });

  it('should return axe config based on wcag level', () => {
    const auditor = new A11yAuditor({ wcagLevel: 'AAA' });
    const config = auditor.getAxeConfig();
    expect(config.runOnly.values).toContain('wcag2aaa');
  });

  it('should clear results', () => {
    const auditor = new A11yAuditor();
    auditor.addPageResult({
      url: 'https://example.com',
      timestamp: '',
      violations: [],
      passes: 5,
      incomplete: 0,
      inapplicable: 0,
      scanDuration: 100,
    });

    expect(auditor.getPages()).toHaveLength(1);
    auditor.clear();
    expect(auditor.getPages()).toHaveLength(0);
  });
});
