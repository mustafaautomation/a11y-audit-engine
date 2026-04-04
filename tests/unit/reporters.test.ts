import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AuditReport } from '../../src/core/types';
import { generateHtmlReport } from '../../src/reporters/html.reporter';
import { generateJsonReport } from '../../src/reporters/json.reporter';

const TMP = path.join(__dirname, '.tmp-reporters');

function makeReport(): AuditReport {
  return {
    timestamp: '2025-06-01T12:00:00.000Z',
    wcagLevel: 'AA',
    pages: [
      {
        url: 'https://example.com',
        timestamp: '2025-06-01T12:00:00.000Z',
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            description: 'Images must have alt text',
            help: 'Ensure images have alt attributes',
            helpUrl: 'https://example.com/help',
            wcagTags: ['wcag2a'],
            nodes: [{ html: '<img src="photo.jpg">', target: ['img'], failureSummary: 'Add alt text' }],
          },
        ],
        passes: 25,
        incomplete: 1,
        inapplicable: 3,
        scanDuration: 1500,
      },
    ],
    summary: {
      totalPages: 1,
      totalViolations: 1,
      criticalCount: 1,
      seriousCount: 0,
      moderateCount: 0,
      minorCount: 0,
      passRate: 0.926,
    },
    score: 82,
    grade: 'B',
  };
}

describe('HTML Reporter', () => {
  afterEach(() => {
    if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
  });

  it('should generate HTML report', () => {
    const outputPath = path.join(TMP, 'report.html');
    generateHtmlReport(makeReport(), outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('Accessibility Audit Report');
    expect(content).toContain('image-alt');
    expect(content).toContain('critical');
  });
});

describe('JSON Reporter', () => {
  afterEach(() => {
    if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
  });

  it('should generate JSON report', () => {
    const outputPath = path.join(TMP, 'report.json');
    generateJsonReport(makeReport(), outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(data.wcagLevel).toBe('AA');
    expect(data.summary.criticalCount).toBe(1);
  });
});
