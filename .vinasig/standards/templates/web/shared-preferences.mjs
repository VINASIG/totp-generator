// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import process from 'node:process';

/**
 * @param {import('playwright').Browser} browser
 * @param {string} baseURL
 */
export async function checkSharedPreferences(browser, baseURL) {
  const plain = await browser.newContext({ javaScriptEnabled: false });
  let viPath;
  let enPath;
  let referenceSameSite = 'Lax';
  try {
    const page = await plain.newPage();
    await page.goto(baseURL);
    const vi = await page
      .locator('link[rel="alternate"][hreflang="vi"]')
      .getAttribute('href');
    const en = await page
      .locator('link[rel="alternate"][hreflang="en"]')
      .getAttribute('href');
    assert(vi && en, 'Both independently rendered locale routes are required');
    viPath = new URL(vi, baseURL).pathname;
    enPath = new URL(en, baseURL).pathname;
    assert(
      await page.locator('.language-switch').getAttribute('href'),
      'Keep the native no-script locale link',
    );
    assert(await page.locator('[data-theme-toggle]').isDisabled());
    await plain.addCookies([
      {
        name: '__Secure-reference-lax',
        value: 'fixture',
        domain: '.vinasig.io.vn',
        path: '/',
        secure: true,
        sameSite: 'Lax',
      },
    ]);
    referenceSameSite =
      (await plain.cookies()).find(
        (item) => item.name === '__Secure-reference-lax',
      )?.sameSite ?? '';
    assert.equal(
      referenceSameSite,
      process.platform === 'win32' && browser.browserType().name() === 'webkit'
        ? 'None'
        : 'Lax',
      'Calibrate the known Windows WebKit protocol representation with an independently specified Lax cookie',
    );
  } finally {
    await plain.close();
  }

  const originA = 'https://vinasig.io.vn';
  const originB = 'https://preferences-fixture.vinasig.io.vn';
  /** @param {import('playwright').BrowserContext} context */
  async function intercept(context) {
    await context.addInitScript(() => {
      const descriptor = Object.getOwnPropertyDescriptor(
        Document.prototype,
        'cookie',
      );
      if (!descriptor?.get || !descriptor.set)
        throw new Error('Cannot inspect native cookie declarations');
      const read = descriptor.get;
      const write = descriptor.set;
      /** @type {string[]} */
      const declarations = [];
      Object.defineProperty(window, '__vinasigCookieDeclarations', {
        value: declarations,
      });
      Object.defineProperty(Document.prototype, 'cookie', {
        configurable: true,
        get() {
          return read.call(this);
        },
        set(value) {
          declarations.push(value);
          write.call(this, value);
        },
      });
    });
    await context.route(
      /^https:\/\/(?:vinasig\.io\.vn|preferences-fixture\.vinasig\.io\.vn|vinasig\.io\.vn\.attacker\.invalid)\//,
      async (route) => {
        const target = new URL(route.request().url());
        const local = new URL(target.pathname + target.search, baseURL);
        const response = await route.fetch({
          url: local.href,
          headers: { ...route.request().headers(), host: local.host },
        });
        assert.equal(
          response.status(),
          200,
          `The real artifact must serve ${target.pathname}`,
        );
        await route.fulfill({ response });
      },
    );
  }
  /** @param {import('playwright').Page} page @param {string} theme */
  async function theme(page, theme) {
    await page.bringToFront();
    await page.waitForFunction(
      (expected) => document.documentElement.dataset.theme === expected,
      theme,
    );
    assert.equal(
      await page.locator('[data-theme-toggle]').getAttribute('aria-pressed'),
      String(theme === 'dark'),
    );
  }
  /** @param {import('playwright').Page} page @param {string} language */
  async function language(page, language) {
    await page.bringToFront();
    await page.waitForFunction(
      (expected) =>
        document.documentElement.lang === expected &&
        document.documentElement.dataset.preferencesReady === 'true',
      language,
    );
  }
  /** @param {import('playwright').Page} page */
  async function storage(page) {
    return page.evaluate(() => ({
      keys: Object.keys(localStorage),
      session: sessionStorage.length,
    }));
  }

  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({
      locale: 'vi-VN',
      colorScheme: /** @type {'light'|'dark'} */ (scheme),
      reducedMotion: 'reduce',
    });
    await intercept(context);
    try {
      const first = await context.newPage();
      await first.goto(originA + '/');
      await first.emulateMedia({
        colorScheme: /** @type {'light'|'dark'} */ (scheme),
      });
      assert.equal(
        await first.evaluate(
          () => matchMedia('(prefers-color-scheme: dark)').matches,
        ),
        scheme === 'dark',
        'The native media query must report the configured browser fixture before inspecting the application',
      );
      await language(first, 'vi');
      assert.equal(new URL(first.url()).pathname, viPath);
      await theme(first, scheme);
      assert.deepEqual(await context.cookies(), []);
      assert.deepEqual(await storage(first), { keys: [], session: 0 });
      const opposite = scheme === 'light' ? 'dark' : 'light';
      await first.emulateMedia({ colorScheme: opposite });
      await theme(first, opposite);
      await first.locator('[data-theme-toggle]').click();
      await theme(first, scheme);
      await first.emulateMedia({ colorScheme: opposite });
      await theme(first, scheme);
      const second = await context.newPage();
      await second.goto(originB + '/');
      await language(second, 'vi');
      await theme(second, scheme);
      await second.locator('[data-theme-toggle]').click();
      await first.bringToFront();
      await theme(first, opposite);
      await second.evaluate(() => {
        const input = document.createElement('input');
        input.id = 'shared-preference-disposable-input';
        document.body.append(input);
      });
      await second
        .locator('#shared-preference-disposable-input')
        .fill('disposable local data');
      await first.locator('.language-switch').click();
      await language(first, 'en');
      assert.equal(new URL(first.url()).pathname, enPath);
      await second.bringToFront();
      await second.waitForFunction(
        () => document.documentElement.dataset.languagePending === 'en',
      );
      assert.equal(await second.locator('html').getAttribute('lang'), 'vi');
      assert.equal(
        await second
          .locator('#shared-preference-disposable-input')
          .inputValue(),
        'disposable local data',
      );
      const declarations = await second.evaluate(() =>
        Reflect.get(window, '__vinasigCookieDeclarations'),
      );
      await second.reload();
      await language(second, 'en');
      assert.equal(new URL(second.url()).pathname, enPath);
      const cookies = await context.cookies();
      assert.equal(cookies.length, 2);
      for (const item of cookies) {
        assert(
          ['__Secure-vinasig-theme', '__Secure-vinasig-language'].includes(
            item.name,
          ),
        );
        assert.equal(item.domain, '.vinasig.io.vn');
        assert.equal(item.path, '/');
        assert.equal(item.secure, true);
        assert.equal(item.sameSite, referenceSameSite);
        assert(
          item.expires > Date.now() / 1000 &&
            item.expires <= Date.now() / 1000 + 31536001,
        );
        assert(['light', 'dark', 'vi', 'en'].includes(item.value));
      }
      assert.deepEqual(await storage(first), { keys: [], session: 0 });
      assert.deepEqual(await storage(second), { keys: [], session: 0 });
      assert(Array.isArray(declarations) && declarations.length > 0);
      for (const declaration of declarations)
        assert.match(
          declaration,
          /^__Secure-vinasig-(?:theme=(?:light|dark)|language=(?:vi|en)); Domain=vinasig\.io\.vn; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/,
        );
      const late = await context.newPage();
      await late.goto(originB + viPath);
      await language(late, 'en');
      await theme(late, opposite);
    } finally {
      await context.close();
    }
  }

  for (const locale of ['en-US', 'fr-FR']) {
    const context = await browser.newContext({ locale, colorScheme: 'light' });
    await intercept(context);
    try {
      const page = await context.newPage();
      await page.goto(originA + '/');
      await language(page, 'en');
      await page.goto(originA + viPath);
      if (viPath !== '/') await language(page, 'vi');
      assert.deepEqual(await context.cookies(), []);
    } finally {
      await context.close();
    }
  }

  const fallback = await browser.newContext({
    locale: 'vi-VN',
    colorScheme: 'dark',
  });
  await intercept(fallback);
  await fallback.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      if (query === '(prefers-color-scheme: dark)')
        throw new Error('Fixture unavailable appearance');
      return original(query);
    };
    Object.defineProperty(Document.prototype, 'cookie', {
      get() {
        throw new Error('Fixture blocked cookies');
      },
      set() {
        throw new Error('Fixture blocked cookies');
      },
    });
    Storage.prototype.getItem = () => {
      throw new Error('Fixture blocked storage');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Fixture blocked storage');
    };
    Storage.prototype.removeItem = () => {
      throw new Error('Fixture blocked storage');
    };
  });
  try {
    const page = await fallback.newPage();
    await page.goto(originA + viPath);
    await language(page, 'vi');
    await theme(page, 'light');
    await page.locator('[data-theme-toggle]').click();
    await theme(page, 'dark');
    await page.locator('[data-theme-toggle]').click();
    await theme(page, 'light');
    assert.deepEqual(await fallback.cookies(), []);
  } finally {
    await fallback.close();
  }

  const lookalike = await browser.newContext({
    locale: 'en-US',
    colorScheme: 'light',
  });
  await intercept(lookalike);
  try {
    const page = await lookalike.newPage();
    await page.goto('https://vinasig.io.vn.attacker.invalid' + enPath);
    await language(page, 'en');
    await page.locator('[data-theme-toggle]').click();
    await theme(page, 'dark');
    assert.deepEqual(await lookalike.cookies(), []);
    assert.deepEqual(await storage(page), {
      keys: ['vinasig-theme'],
      session: 0,
    });
  } finally {
    await lookalike.close();
  }

  for (const manual of [false, true]) {
    const legacy = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
    });
    await intercept(legacy);
    if (manual)
      await legacy.addCookies([
        {
          name: '__Secure-vinasig-theme',
          value: 'light',
          domain: '.vinasig.io.vn',
          path: '/',
          secure: true,
          sameSite: 'Lax',
        },
      ]);
    await legacy.addInitScript(() => {
      if (location.hostname === 'vinasig.io.vn')
        localStorage.setItem('vinasig-theme', 'dark');
    });
    try {
      const page = await legacy.newPage();
      await page.goto(originA + enPath);
      await language(page, 'en');
      await theme(page, manual ? 'light' : 'dark');
      assert.deepEqual(await storage(page), { keys: [], session: 0 });
      const cookies = await legacy.cookies();
      assert.equal(cookies.length, 1);
      assert.equal(cookies[0]?.value, manual ? 'light' : 'dark');
      const other = await legacy.newPage();
      await other.goto(originB + enPath);
      await theme(other, manual ? 'light' : 'dark');
    } finally {
      await legacy.close();
    }
  }

  for (const duplicate of [false, true]) {
    const corrupted = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
    });
    await intercept(corrupted);
    await corrupted.addCookies([
      {
        name: '__Secure-vinasig-theme',
        value: duplicate ? 'dark' : 'arbitrary-invalid-value',
        domain: '.vinasig.io.vn',
        path: '/',
        secure: true,
      },
      {
        name: '__Secure-vinasig-language',
        value: '../../foreign',
        domain: '.vinasig.io.vn',
        path: '/',
        secure: true,
      },
      ...(duplicate
        ? [
            {
              name: '__Secure-vinasig-theme',
              value: 'light',
              url: originA,
              secure: true,
            },
          ]
        : []),
    ]);
    try {
      const page = await corrupted.newPage();
      await page.goto(originA + '/');
      await language(page, 'en');
      await theme(page, 'light');
      assert.deepEqual(await storage(page), { keys: [], session: 0 });
    } finally {
      await corrupted.close();
    }
  }

  const languages = await browser.newContext({
    locale: 'en-US',
    colorScheme: 'light',
  });
  await intercept(languages);
  await languages.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['fr-FR', 'vi-VN', 'en-US'],
    });
  });
  try {
    const page = await languages.newPage();
    await page.goto(originA + '/');
    await language(page, 'vi');
    assert.deepEqual(await languages.cookies(), []);
  } finally {
    await languages.close();
  }
}
