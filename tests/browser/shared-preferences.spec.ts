import path from 'node:path';
import { test } from '@playwright/test';
import { startServer } from '../../scripts/serve.ts';
import { checkSharedPreferences } from '../../.vinasig/standards/templates/web/shared-preferences.mjs';
let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
test('shared ecosystem preferences preserve local work', async ({
  browser,
}) => {
  test.setTimeout(120000);
  await checkSharedPreferences(browser, app.url);
});
