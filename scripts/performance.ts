import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'node:net';
import { record } from './local.ts';
import { startServer } from './serve.ts';
import { repositoryRoot, writeOutput, readOptional } from './local.ts';

const phase = process.argv.includes('--baseline') ? 'before' : 'after';
const profile = process.argv.includes('--english') ? 'en' : 'vi';
const root = path.join(repositoryRoot, 'dist');
if (phase === 'before')
  assert(
    !(await readOptional(
      repositoryRoot,
      `output/lighthouse/before/${profile}/mobile-1.json`,
    )),
    'Never overwrite the initial performance baseline',
  );
const app = await startServer(root);
const reservation = createServer();
await new Promise<void>((resolve) => {
  reservation.listen(0, '127.0.0.1', resolve);
});
const address = reservation.address();
assert(address && typeof address !== 'string');
const port = address.port;
await new Promise<void>((resolve, reject) => {
  reservation.close((error) => {
    if (error) reject(error);
    else resolve();
  });
});
const browserLanguage = profile === 'vi' ? 'vi-VN' : 'en-US';
const chrome = await chromium.launch({
  args: [
    `--remote-debugging-port=${String(port)}`,
    `--accept-lang=${browserLanguage}`,
  ],
});
const localeProbe = await chrome.newPage();
assert.equal(
  await localeProbe.evaluate(() => navigator.languages[0]),
  browserLanguage,
  'The lab browser must use the locale under measurement',
);
await localeProbe.close();
// The pinned Lighthouse trace dependency has an incompatible declaration under
// exactOptionalPropertyTypes. Validate this external runtime boundary explicitly
// instead of disabling declaration checking for the project.
const moduleName: string = 'lighthouse';
const loaded: unknown = await import(moduleName);
const driver = record(loaded)['default'];
assert(typeof driver === 'function');
const lighthouse = driver as (
  url: string,
  flags: Record<string, unknown>,
) => Promise<unknown>;
const metrics: {
  formFactor: 'mobile' | 'desktop';
  run: number;
  lcp: number;
  cls: number;
  tbt: number;
  performance: unknown;
  accessibility: unknown;
  seo: unknown;
  bestPractices: unknown;
}[] = [];
try {
  for (const formFactor of ['mobile', 'desktop'] as const)
    for (let run = 1; run <= 3; run++) {
      const mobile = formFactor === 'mobile';
      const flags = {
        port,
        output: ['json', 'html'] as ('json' | 'html')[],
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
        formFactor,
        screenEmulation: {
          mobile,
          width: mobile ? 390 : 1440,
          height: mobile ? 844 : 900,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttling: {
          rttMs: mobile ? 150 : 40,
          throughputKbps: mobile ? 1638.4 : 10240,
          cpuSlowdownMultiplier: mobile ? 4 : 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        throttlingMethod: 'simulate' as const,
      };
      const result = record(
        await lighthouse(app.url + (profile === 'en' ? 'en/' : ''), flags),
      );
      const lhr = record(result['lhr']);
      const audits = record(lhr['audits']);
      const categories = record(lhr['categories']);
      const lcp = record(audits['largest-contentful-paint'])['numericValue'];
      const cls = record(audits['cumulative-layout-shift'])['numericValue'];
      const tbt = record(audits['total-blocking-time'])['numericValue'];
      assert(
        typeof lcp === 'number' &&
          typeof cls === 'number' &&
          typeof tbt === 'number',
      );
      const row = {
        formFactor,
        run,
        lcp,
        cls,
        tbt,
        performance: record(categories['performance'])['score'],
        accessibility: record(categories['accessibility'])['score'],
        seo: record(categories['seo'])['score'],
        bestPractices: record(categories['best-practices'])['score'],
      };
      metrics.push(row);
      const report: unknown = result['report'];
      assert(Array.isArray(report));
      for (const [index, extension] of ['json', 'html'].entries()) {
        const contents: unknown = report[index];
        assert(typeof contents === 'string');
        await writeOutput(
          repositoryRoot,
          `output/lighthouse/${phase}/${profile}/${formFactor}-${String(run)}.${extension}`,
          contents,
        );
      }
      console.log(JSON.stringify(row));
    }
  const summaries = ['mobile', 'desktop'].map((formFactor) => {
    const rows = metrics.filter((row) => row.formFactor === formFactor);
    const median = (key: 'lcp' | 'cls' | 'tbt') => {
      const values = rows.map((row) => row[key]).sort((a, b) => a - b);
      const result = values[1];
      assert(typeof result === 'number');
      return result;
    };
    const row = {
      formFactor,
      lcp: median('lcp'),
      cls: median('cls'),
      tbt: median('tbt'),
      ranges: {
        lcp: rows.map((value) => value.lcp),
        cls: rows.map((value) => value.cls),
        tbt: rows.map((value) => value.tbt),
      },
    };
    if (phase === 'after') {
      assert(row.lcp <= 2500, 'Median LCP exceeds 2500 ms');
      assert(row.cls <= 0.1, 'Median CLS exceeds 0.1');
      assert(row.tbt <= 200, 'Median TBT exceeds 200 ms');
    }
    return row;
  });
  await writeOutput(
    repositoryRoot,
    `output/lighthouse/${phase}/${profile}/summary.json`,
    `${JSON.stringify({ status: 'PASS', phase, environment: { browser: chromium.executablePath().split(path.sep).slice(-3).join('/'), node: process.version, browserLanguage, cache: 'Lighthouse default cold navigation', network: 'simulated mobile 150 ms / 1.6 Mbps / 4x CPU; desktop 40 ms / 10 Mbps / 1x CPU', viewport: '390x844 and 1440x900', fieldMetrics: 'NOT_RUN' }, metrics, summaries }, null, 2)}\n`,
  );
  console.log(JSON.stringify(summaries));
} finally {
  await chrome.close();
  await app.close();
}
