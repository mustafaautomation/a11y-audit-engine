#!/usr/bin/env node

import { Command } from 'commander';
import { A11yAuditor } from './core/auditor';
import { WcagLevel } from './core/types';
import { printReport } from './reporters/console.reporter';
import { generateHtmlReport } from './reporters/html.reporter';
import { generateJsonReport } from './reporters/json.reporter';

const program = new Command();

program
  .name('a11y-audit')
  .description('Accessibility auditing CLI — scan pages for WCAG compliance')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan URLs for accessibility violations (requires Playwright)')
  .argument('<urls...>', 'URLs to scan')
  .option('-l, --level <level>', 'WCAG level: A, AA, AAA', 'AA')
  .option('--best-practices', 'Include best practice checks')
  .option('--html <path>', 'Generate HTML report')
  .option('--json <path>', 'Generate JSON report')
  .action(async (urls: string[], options) => {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch();
      const context = await browser.newContext();

      const auditor = new A11yAuditor({
        wcagLevel: options.level as WcagLevel,
        includeBestPractices: options.bestPractices || false,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const axeSource = require('axe-core').source as string;
      const axeConfig = auditor.getAxeConfig();

      for (const url of urls) {
        const page = await context.newPage();
        const start = Date.now();

        await page.goto(url, { waitUntil: 'networkidle' });
        await page.evaluate(axeSource);

        const results = await page.evaluate((config) => {
          // @ts-expect-error axe is injected at runtime
          return window.axe.run(document, config);
        }, axeConfig);

        const duration = Date.now() - start;
        auditor.parseResults(url, results, duration);
        await page.close();
      }

      await browser.close();

      const report = auditor.getReport();
      printReport(report);

      if (options.html) {
        generateHtmlReport(report, options.html);
        console.log(`HTML report: ${options.html}`);
      }
      if (options.json) {
        generateJsonReport(report, options.json);
        console.log(`JSON report: ${options.json}`);
      }

      if (report.summary.criticalCount > 0) {
        process.exit(1);
      }
    } catch (err) {
      console.error(`Scan failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
