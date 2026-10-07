import { defineConfig } from '@playwright/test';

const engines = ['chromium', 'firefox', 'webkit'] as const;
const selected = process.env['BROWSER_ENGINES']?.split(',') ?? [...engines];
if (
  selected.some((name) => !engines.includes(name as (typeof engines)[number]))
)
  throw new Error('Unsupported browser selection');
if (process.env['CI'] && engines.some((name) => !selected.includes(name)))
  throw new Error('CI must check all supported engines');

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  outputDir: 'output/playwright/results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'output/playwright/report', open: 'never' }],
    ['json', { outputFile: 'output/playwright/report.json' }],
  ],
  use: {
    locale: 'vi-VN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    acceptDownloads: true,
  },
  projects: engines
    .filter((name) => selected.includes(name))
    .map((name) => ({ name, use: { browserName: name } })),
});
