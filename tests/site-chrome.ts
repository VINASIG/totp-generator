import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

const project = JSON.parse(await readFile('package.json', 'utf8')) as {
  repository: { url: string };
  homepage: string;
};
const repo = project.repository.url
  .replace(/\.git$/, '')
  .split('/')
  .at(-1);
assert(repo);
const cssPath =
  repo === 'unphar' ? 'site-chrome.css' : 'src/styles/site-chrome.css';
const cssHash = createHash('sha256')
  .update(await readFile(cssPath))
  .digest('hex');
const expected = (await readFile('tests/site-chrome.sha256', 'utf8')).trim();
assert.equal(cssHash, expected, 'Reviewed shared chrome CSS drifted');
const root = path.resolve('dist');
const server = createServer((request, response) => {
  void (async () => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      let filename = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      assert(filename === root || filename.startsWith(root + path.sep));
      if ((await stat(filename)).isDirectory())
        filename = path.join(filename, 'index.html');
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.png': 'image/png',
        '.wasm': 'application/wasm',
        '.txt': 'text/plain',
      };
      response.writeHead(200, {
        'Content-Type':
          types[path.extname(filename)] ?? 'application/octet-stream',
      });
      response.end(await readFile(filename));
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  })();
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
assert(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${String(address.port)}`;
const viFirst = [
  'qr-scanner',
  'totp-generator',
  'bmi-calculator',
  'nvqs-bmi-calculator',
].includes(repo);
const routes = ['/', viFirst ? '/en/' : '/vi/'];
if (repo === 'qr-scanner') routes.push('/licenses/', '/en/licenses/');
if (repo === 'vinasig') routes.push('/404.html', '/vi/404/');
if (repo === 'web-design-system') {
  for (const section of [
    'brand',
    'foundations',
    'components',
    'patterns',
    'elements',
    'agents',
  ])
    routes.push(`/${section}/`, `/vi/${section}/`);
  routes.push('/404.html', '/vi/404/');
}
const out = 'output/responsive/site-chrome';
await mkdir(out, { recursive: true });
const engines = { chromium, firefox, webkit };
const selection =
  process.env['RESPONSIVE_ENGINE']?.split(',') ??
  process.env['BROWSER_ENGINE']?.split(',') ??
  process.env['BROWSER_ENGINES']?.split(',') ??
  Object.keys(engines);
assert(
  selection.length > 0 &&
    selection.every((name) => Object.hasOwn(engines, name)),
  'Unsupported browser selection',
);
let checks = 0;
try {
  for (const [engine, launcher] of Object.entries(engines).filter(([name]) =>
    selection.includes(name),
  )) {
    const browser = await launcher.launch();
    try {
      for (const theme of ['light', 'dark'] as const) {
        const context = await browser.newContext({
          locale: viFirst ? 'vi-VN' : 'en-US',
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        for (const route of routes) {
          await page.goto(origin + route);
          await page.locator('[data-theme-toggle]:enabled').waitFor();
          await page.evaluate(() => document.fonts.ready);
          for (const width of [
            320, 360, 390, 600, 759, 760, 761, 768, 776, 777, 778, 1024, 1440,
          ]) {
            await page.setViewportSize({
              width,
              height: width === 768 ? 1024 : width === 1440 ? 900 : 800,
            });
            await page.evaluate(() => {
              scrollTo(0, 0);
            });
            await page.evaluate(
              () =>
                new Promise<void>((resolve) =>
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                      resolve();
                    }),
                  ),
                ),
            );
            const geometry = await page.evaluate(() => {
              const header = document.querySelector<HTMLElement>(
                'header[data-site-header]',
              );
              const logo = header?.querySelector<HTMLImageElement>(
                '[data-brand-logo] img',
              );
              const prefs =
                header?.querySelector<HTMLElement>('.site-preferences');
              const footer = document.querySelector<HTMLElement>(
                'footer[data-site-footer]',
              );
              const links = [
                ...(footer?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
              ];
              const rect = (element: Element | null | undefined) => {
                assertElement(element);
                return element.getBoundingClientRect().toJSON() as {
                  x: number;
                  y: number;
                  width: number;
                  height: number;
                };
              };
              function assertElement(
                element: Element | null | undefined,
              ): asserts element is Element {
                if (!element) throw Error('Missing chrome element');
              }
              return {
                logo: rect(logo),
                prefs: rect(prefs),
                footer: rect(footer),
                links: links.map((link) => ({
                  href: link.href,
                  text: link.textContent.trim(),
                  height: link.getBoundingClientRect().height,
                })),
                language: document.documentElement.lang,
                compact: matchMedia('(width <= 760px)').matches,
                overflow:
                  document.documentElement.scrollWidth >
                  document.documentElement.clientWidth + 1,
                source: logo?.currentSrc,
              };
            });
            assert.equal(geometry.logo.width, 132);
            assert(
              Math.abs(geometry.logo.width / geometry.logo.height - 540 / 140) <
                0.01,
            );
            assert.equal(geometry.prefs.width, 92);
            assert.equal(
              geometry.prefs.y,
              geometry.compact ? 16 : 32,
              'Shared top safe area drifted',
            );
            assert(
              geometry.logo.x + geometry.logo.width + 16 <= geometry.prefs.x,
            );
            assert(
              Math.abs(
                geometry.logo.y +
                  geometry.logo.height / 2 -
                  geometry.prefs.y -
                  geometry.prefs.height / 2,
              ) < 1,
            );
            assert(!geometry.overflow, `${route} ${String(width)} overflows`);
            assert(geometry.links.length >= 4);
            assert.equal(geometry.links[0]?.href, 'https://vinasig.io.vn/');
            assert(
              geometry.links[1]?.href.startsWith(
                `https://github.com/VINASIG/${repo}`,
              ),
            );
            assert.equal(
              geometry.links[2]?.href,
              `https://github.com/VINASIG/${repo}/issues`,
            );
            assert.equal(
              geometry.links[3]?.text,
              geometry.language === 'vi' ? 'Giấy phép' : 'Licenses',
            );
            assert(geometry.links.every((link) => link.height >= 44));
            const notice = await page.request.get(geometry.links[3].href);
            assert(notice.ok());
            if (width === 320 || width === 1440) {
              const routeName =
                route === '/'
                  ? 'root'
                  : route.replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              const label = `${routeName}-${engine}-${theme}-${String(width)}`;
              await page.evaluate(() => {
                scrollTo(0, 0);
              });
              await page.screenshot({ path: `${out}/${label}-header.png` });
              await page.locator('[data-site-footer]').scrollIntoViewIfNeeded();
              await page.screenshot({ path: `${out}/${label}-footer.png` });
            }
            checks++;
          }
        }
        await page.setViewportSize({ width: 320, height: 800 });
        await page.goto(origin + '/');
        await page.locator('[data-theme-toggle]:enabled').waitFor();
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
        assert(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth + 1,
          ),
        );
        await page.screenshot({
          path: `${out}/${engine}-${theme}-200-percent.png`,
          fullPage: true,
        });
        await page.evaluate(() => {
          scrollTo(0, document.documentElement.scrollHeight);
        });
        await page.screenshot({
          path: `${out}/${engine}-${theme}-200-percent-footer.png`,
        });
        const toggle = page.locator('[data-theme-toggle]');
        await toggle.focus();
        await page.keyboard.press('Space');
        assert.equal(
          await toggle.getAttribute('aria-pressed'),
          theme === 'light' ? 'true' : 'false',
        );
        await page.locator('.language-switch').click();
        assert.equal(
          await page.locator('html').getAttribute('lang'),
          viFirst ? 'en' : 'vi',
        );
        await context.close();
        const noScript = await browser.newContext({
          javaScriptEnabled: false,
          colorScheme: theme,
          viewport: { width: 320, height: 800 },
        });
        const fallback = await noScript.newPage();
        await fallback.goto(origin + '/');
        assert.equal(
          await fallback.locator('[data-brand-logo]').getAttribute('href'),
          'https://vinasig.io.vn/',
        );
        const image = await fallback
          .locator('[data-brand-logo] img')
          .evaluate((img: HTMLImageElement) => img.currentSrc);
        assert(
          image.endsWith(
            theme === 'dark' ? 'reversed.svg' : 'primary-color.svg',
          ),
        );
        assert.equal(
          await fallback.locator('[data-site-footer] a').count(),
          repo === 'vinasig' ? 5 : 4,
        );
        await noScript.close();
      }
    } finally {
      await browser.close();
    }
    console.log(`${engine} site chrome PASS`);
  }
} finally {
  server.closeAllConnections();
  await new Promise<void>((resolve) =>
    server.close(() => {
      resolve();
    }),
  );
}
console.log(`${String(checks)} site chrome route/theme/width cases passed.`);
