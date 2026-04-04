import { AuditConfig, AuditReport, PageResult, DEFAULT_CONFIG } from './types';
import { buildAxeRunConfig, parseAxeResults, computeScore, buildSummary } from './scanner';

export class A11yAuditor {
  private config: AuditConfig;
  private pages: PageResult[] = [];

  constructor(config?: Partial<AuditConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addPageResult(result: PageResult): void {
    this.pages.push(result);
  }

  getAxeConfig(): { runOnly: { type: string; values: string[] } } {
    return buildAxeRunConfig(this.config);
  }

  parseResults(url: string, axeResults: Parameters<typeof parseAxeResults>[1], duration: number): PageResult {
    const result = parseAxeResults(url, axeResults, duration);
    this.pages.push(result);
    return result;
  }

  getReport(): AuditReport {
    const summary = buildSummary(this.pages);
    const { score, grade } = computeScore(this.pages);

    return {
      timestamp: new Date().toISOString(),
      wcagLevel: this.config.wcagLevel,
      pages: this.pages,
      summary,
      score,
      grade,
    };
  }

  getPages(): PageResult[] {
    return [...this.pages];
  }

  clear(): void {
    this.pages = [];
  }
}
