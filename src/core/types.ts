export type WcagLevel = 'A' | 'AA' | 'AAA';
export type Impact = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AuditConfig {
  wcagLevel: WcagLevel;
  includeBestPractices: boolean;
  tags: string[];
}

export interface Violation {
  id: string;
  impact: Impact;
  description: string;
  help: string;
  helpUrl: string;
  wcagTags: string[];
  nodes: ViolationNode[];
}

export interface ViolationNode {
  html: string;
  target: string[];
  failureSummary: string;
}

export interface PageResult {
  url: string;
  timestamp: string;
  violations: Violation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  scanDuration: number;
}

export interface AuditReport {
  timestamp: string;
  wcagLevel: WcagLevel;
  pages: PageResult[];
  summary: {
    totalPages: number;
    totalViolations: number;
    criticalCount: number;
    seriousCount: number;
    moderateCount: number;
    minorCount: number;
    passRate: number;
  };
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export const DEFAULT_CONFIG: AuditConfig = {
  wcagLevel: 'AA',
  includeBestPractices: false,
  tags: [],
};
