import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';

export const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

/** @param {number[]} breakpoints */
export function breakpointWidths(breakpoints) {
  return [
    ...new Set([
      320,
      600,
      900,
      1280,
      ...breakpoints.flatMap((width) => [width - 1, width, width + 1]),
    ]),
  ].sort((a, b) => a - b);
}

/** @param {import('@playwright/test').Page} page */
export async function assertNoPageOverflow(page) {
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(
    widths.document,
    'Unexpected document horizontal overflow',
  ).toBeLessThanOrEqual(widths.viewport + 1);
}

/** @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} info
 * @param {string} name */
export async function captureFullPage(page, info, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  for (
    let top = 0;
    top < height;
    top += Math.max(1, page.viewportSize()?.height ?? 600)
  ) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const screenshot = info.outputPath(`${name}.png`);
  await page.screenshot({
    path: screenshot,
    fullPage: true,
    animations: 'disabled',
  });
  await info.attach(name, { path: screenshot, contentType: 'image/png' });
  return screenshot;
}

/** @param {import('@playwright/test').Page} page */
export async function assertAutomatedAccessibility(page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations,
    'Automated axe findings; manual WCAG review remains necessary',
  ).toEqual([]);
}
