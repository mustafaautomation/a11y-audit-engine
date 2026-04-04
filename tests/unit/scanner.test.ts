import { describe, it, expect } from 'vitest';
import {
  buildAxeRunConfig,
  parseAxeResults,
  computeScore,
  buildSummary,
} from '../../src/core/scanner';
import { PageResult } from '../../src/core/types';

describe('buildAxeRunConfig', () => {
  it('should include WCAG A tags for level A', () => {
    const config = buildAxeRunConfig({ wcagLevel: 'A', includeBestPractices: false, tags: [] });
    expect(config.runOnly.values).toContain('wcag2a');
    expect(config.runOnly.values).not.toContain('wcag2aa');
  });

  it('should include WCAG AA tags for level AA', () => {
    const config = buildAxeRunConfig({ wcagLevel: 'AA', includeBestPractices: false, tags: [] });
    expect(config.runOnly.values).toContain('wcag2a');
    expect(config.runOnly.values).toContain('wcag2aa');
    expect(config.runOnly.values).toContain('wcag22aa');
  });

  it('should include AAA tags for level AAA', () => {
    const config = buildAxeRunConfig({ wcagLevel: 'AAA', includeBestPractices: false, tags: [] });
    expect(config.runOnly.values).toContain('wcag2aaa');
  });

  it('should include best-practice tag when enabled', () => {
    const config = buildAxeRunConfig({ wcagLevel: 'AA', includeBestPractices: true, tags: [] });
    expect(config.runOnly.values).toContain('best-practice');
  });

  it('should use custom tags when provided', () => {
    const config = buildAxeRunConfig({
      wcagLevel: 'AA',
      includeBestPractices: false,
      tags: ['custom-tag'],
    });
    expect(config.runOnly.values).toContain('custom-tag');
    expect(config.runOnly.values).not.toContain('wcag2a');
  });
});

describe('parseAxeResults', () => {
  it('should parse violations, passes, and counts', () => {
    const axeResults = {
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help: 'Ensure sufficient color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
          tags: ['wcag2aa', 'wcag143'],
          nodes: [
            {
              html: '<span style="color: #ccc">Low contrast</span>',
              target: ['span'],
              failureSummary: 'Fix the color contrast ratio',
            },
          ],
        },
      ],
      passes: [{ id: 'document-title' }, { id: 'html-lang-valid' }],
      incomplete: [{ id: 'aria-allowed-attr' }],
      inapplicable: [{ id: 'frame-title' }],
    };

    const result = parseAxeResults('https://example.com', axeResults, 1500);

    expect(result.url).toBe('https://example.com');
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].id).toBe('color-contrast');
    expect(result.violations[0].impact).toBe('serious');
    expect(result.violations[0].nodes).toHaveLength(1);
    expect(result.passes).toBe(2);
    expect(result.incomplete).toBe(1);
    expect(result.inapplicable).toBe(1);
    expect(result.scanDuration).toBe(1500);
  });

  it('should filter wcag tags from violation tags', () => {
    const axeResults = {
      violations: [
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'test',
          help: 'test',
          helpUrl: 'https://example.com',
          tags: ['wcag2a', 'wcag111', 'best-practice', 'cat.text-alternatives'],
          nodes: [],
        },
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
    };

    const result = parseAxeResults('https://example.com', axeResults, 100);
    expect(result.violations[0].wcagTags).toEqual(['wcag2a', 'wcag111']);
  });
});

describe('computeScore', () => {
  function makePageResult(overrides: Partial<PageResult> = {}): PageResult {
    return {
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      violations: [],
      passes: 50,
      incomplete: 0,
      inapplicable: 5,
      scanDuration: 1000,
      ...overrides,
    };
  }

  it('should return grade A for no violations', () => {
    const pages = [makePageResult({ passes: 100, violations: [] })];
    const { score, grade } = computeScore(pages);
    expect(score).toBe(100);
    expect(grade).toBe('A');
  });

  it('should penalize critical violations', () => {
    const pages = [
      makePageResult({
        passes: 90,
        violations: [
          {
            id: 'test',
            impact: 'critical',
            description: '',
            help: '',
            helpUrl: '',
            wcagTags: [],
            nodes: [],
          },
        ],
      }),
    ];
    const { score } = computeScore(pages);
    expect(score).toBeLessThan(100);
  });

  it('should return grade F for empty pages', () => {
    const { grade } = computeScore([]);
    expect(grade).toBe('F');
  });

  it('should handle multiple pages', () => {
    const pages = [
      makePageResult({ passes: 50, violations: [] }),
      makePageResult({ passes: 40, violations: [] }),
    ];
    const { score, grade } = computeScore(pages);
    expect(score).toBe(100);
    expect(grade).toBe('A');
  });
});

describe('buildSummary', () => {
  it('should aggregate violation counts by impact', () => {
    const pages: PageResult[] = [
      {
        url: 'https://a.com',
        timestamp: '',
        violations: [
          {
            id: '1',
            impact: 'critical',
            description: '',
            help: '',
            helpUrl: '',
            wcagTags: [],
            nodes: [],
          },
          {
            id: '2',
            impact: 'serious',
            description: '',
            help: '',
            helpUrl: '',
            wcagTags: [],
            nodes: [],
          },
        ],
        passes: 10,
        incomplete: 1,
        inapplicable: 0,
        scanDuration: 500,
      },
      {
        url: 'https://b.com',
        timestamp: '',
        violations: [
          {
            id: '3',
            impact: 'moderate',
            description: '',
            help: '',
            helpUrl: '',
            wcagTags: [],
            nodes: [],
          },
        ],
        passes: 20,
        incomplete: 0,
        inapplicable: 0,
        scanDuration: 600,
      },
    ];

    const summary = buildSummary(pages);
    expect(summary.totalPages).toBe(2);
    expect(summary.totalViolations).toBe(3);
    expect(summary.criticalCount).toBe(1);
    expect(summary.seriousCount).toBe(1);
    expect(summary.moderateCount).toBe(1);
    expect(summary.minorCount).toBe(0);
  });
});
