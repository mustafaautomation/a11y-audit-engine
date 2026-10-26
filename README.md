# A11y Audit Engine

[![CI](https://github.com/mustafaautomation/a11y-audit-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/a11y-audit-engine/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2_AA-005A9C.svg)](https://www.w3.org/WAI/WCAG22/quickref/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Automated accessibility auditing engine. Scans web pages against WCAG 2.2 standards using [axe-core](https://github.com/dequelabs/axe-core), generates compliance reports, and integrates into CI pipelines.

---

## Why

- Accessibility regressions are easy to ship and hard to spot in manual review
- Manual audits are slow and only run occasionally
- This engine runs automated WCAG checks with every CI run (automated rules catch a subset of WCAG issues; manual testing is still needed)

---

## Quick Start

Not published to npm; install from source:

```bash
git clone https://github.com/mustafaautomation/a11y-audit-engine.git
cd a11y-audit-engine
npm ci
npx playwright install chromium
npm run build
npm test                 # 41 unit tests

# CLI — scan a page
node dist/cli.js scan https://example.com --html report.html
# or `npm link` once, then use `a11y-audit` as in the examples below
```

To use it as a library in another project, install it from the local checkout (`npm install ../a11y-audit-engine`) and `import { A11yAuditor } from 'a11y-audit-engine'`.

---

## CLI Usage

```bash
# Scan single page (WCAG AA by default)
a11y-audit scan https://example.com

# Scan multiple pages
a11y-audit scan https://example.com https://example.com/about

# Custom WCAG level
a11y-audit scan https://example.com --level AAA

# Include best practices
a11y-audit scan https://example.com --best-practices

# Generate reports
a11y-audit scan https://example.com --html report.html --json report.json
```

The CLI exits with code 1 if any **critical** violations are found so it can be used as a CI gate.

---

## Library API

### A11yAuditor

```typescript
import { A11yAuditor } from 'a11y-audit-engine';

const auditor = new A11yAuditor({
  wcagLevel: 'AA',           // 'A' | 'AA' | 'AAA'
  includeBestPractices: false,
});

// After running axe-core in the browser:
auditor.parseResults(url, axeResults, durationMs);

// Generate report
const report = auditor.getReport();
// { score: 85, grade: 'B', summary: {...}, pages: [...] }
```

### Playwright Integration

```typescript
import { test, expect } from '@playwright/test';
import { A11yAuditor } from 'a11y-audit-engine';
import axe from 'axe-core';

const auditor = new A11yAuditor();

test('homepage has no critical a11y violations', async ({ page }) => {
  await page.goto('https://example.com');
  await page.evaluate(axe.source);

  const results = await page.evaluate(() => window.axe.run(document));
  const pageResult = auditor.parseResults(page.url(), results, 0);

  expect(pageResult.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
});
```

---

## Scoring

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100% | Excellent — minimal or no violations |
| B | 80-89% | Good — some non-critical issues |
| C | 70-79% | Fair — multiple violations need attention |
| D | 60-69% | Poor — significant accessibility barriers |
| F | 0-59% | Failing — critical barriers present |

Score = pass rate - penalties (critical: -10%, serious: -5%, capped at -50%).

---

## Reports

### Console
Colored terminal output with violation details, impact levels, and help links.

### HTML
Dark-themed report with violation cards, affected HTML elements, and direct links to remediation docs.

### JSON
Machine-readable format for CI integration and trend tracking.

---

## What It Checks

Powered by [axe-core](https://github.com/dequelabs/axe-core) rules:

| Category | Examples |
|----------|---------|
| **Perceivable** | Image alt text, color contrast, captions |
| **Operable** | Keyboard navigation, focus management, skip links |
| **Understandable** | Form labels, error identification, consistent navigation |
| **Robust** | Valid HTML, ARIA roles, name/role/value |

---

## Project Structure

```
a11y-audit-engine/
├── src/
│   ├── core/
│   │   ├── types.ts          # Config, violation, report types
│   │   ├── scanner.ts        # axe-core config, result parsing, scoring
│   │   └── auditor.ts        # High-level auditor class
│   ├── reporters/
│   │   ├── console.reporter.ts
│   │   ├── html.reporter.ts
│   │   └── json.reporter.ts
│   ├── cli.ts                # CLI entry point
│   └── index.ts              # Public API
├── tests/unit/
│   ├── scanner.test.ts       # 12 tests — config, parsing, scoring, summary
│   ├── scoring.test.ts       # 16 tests — score and grade calculation
│   ├── wcag-rules.test.ts    # 7 tests — WCAG rule mapping
│   ├── auditor.test.ts       # 4 tests — auditor workflow
│   └── reporters.test.ts     # 2 tests — HTML + JSON output
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
