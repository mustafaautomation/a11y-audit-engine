export { A11yAuditor } from './core/auditor';
export {
  AuditConfig,
  AuditReport,
  PageResult,
  Violation,
  ViolationNode,
  WcagLevel,
  Impact,
  DEFAULT_CONFIG,
} from './core/types';
export { buildAxeRunConfig, parseAxeResults, computeScore, buildSummary } from './core/scanner';
export { printReport } from './reporters/console.reporter';
export { generateHtmlReport } from './reporters/html.reporter';
export { generateJsonReport } from './reporters/json.reporter';
