import { describe, it, expect } from 'vitest';
import { WCAG_CRITERIA } from '../../src/core/wcag-rules';

describe('WCAG Criteria Reference', () => {
  it('should contain all 10 defined criteria', () => {
    expect(Object.keys(WCAG_CRITERIA)).toHaveLength(10);
  });

  it('should have valid levels for all criteria', () => {
    const validLevels = ['A', 'AA', 'AAA'];
    for (const [id, criteria] of Object.entries(WCAG_CRITERIA)) {
      expect(validLevels, `Criterion ${id} has invalid level: ${criteria.level}`).toContain(
        criteria.level,
      );
    }
  });

  it('should have non-empty titles for all criteria', () => {
    for (const [id, criteria] of Object.entries(WCAG_CRITERIA)) {
      expect(criteria.title.length, `Criterion ${id} has empty title`).toBeGreaterThan(0);
    }
  });

  it('should include key Level A criteria', () => {
    expect(WCAG_CRITERIA['1.1.1']).toBeDefined();
    expect(WCAG_CRITERIA['1.1.1'].level).toBe('A');
    expect(WCAG_CRITERIA['1.1.1'].title).toContain('Non-text');

    expect(WCAG_CRITERIA['2.1.1']).toBeDefined();
    expect(WCAG_CRITERIA['2.1.1'].title).toContain('Keyboard');
  });

  it('should include Level AA criteria', () => {
    expect(WCAG_CRITERIA['1.4.3']).toBeDefined();
    expect(WCAG_CRITERIA['1.4.3'].level).toBe('AA');
    expect(WCAG_CRITERIA['1.4.3'].title).toContain('Contrast');
  });

  it('should include Level AAA criteria', () => {
    expect(WCAG_CRITERIA['1.4.6']).toBeDefined();
    expect(WCAG_CRITERIA['1.4.6'].level).toBe('AAA');
    expect(WCAG_CRITERIA['1.4.6'].title).toContain('Enhanced');
  });

  it('should use WCAG 2.x format for criterion IDs', () => {
    for (const id of Object.keys(WCAG_CRITERIA)) {
      expect(id).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
