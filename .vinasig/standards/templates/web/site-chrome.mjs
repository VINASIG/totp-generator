/** Inspect WEB-009 inside page.evaluate. Artwork validation remains separate.
 * @returns {{kind: string, text: string, element: string}[]} */
export function inspectSiteChrome() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  /** @param {string} kind @param {string} text @param {string} element */
  const add = (kind, text, element) => {
    findings.push({ kind, text, element });
  };
  const headers = document.querySelectorAll('header[data-site-header]');
  const footers = document.querySelectorAll('footer[data-site-footer]');
  if (headers.length !== 1)
    add(
      'chrome-header-count',
      'Expected one identity header',
      '[data-site-header]',
    );
  if (footers.length !== 1)
    add(
      'chrome-footer-count',
      'Expected one shared footer',
      '[data-site-footer]',
    );
  const header = headers[0];
  const footer = footers[0];
  const logo = header?.querySelector('[data-brand-logo] img');
  const preferences = header?.querySelector('.site-preferences');
  if (!logo || Math.abs(logo.getBoundingClientRect().width - 132) > 1)
    add(
      'chrome-logo-size',
      'Use the reviewed 132 px lockup',
      '[data-brand-logo] img',
    );
  if (!preferences)
    add(
      'chrome-preferences',
      'Missing appearance/language group',
      '.site-preferences',
    );
  else {
    const controls = [...preferences.querySelectorAll('button,a')];
    if (
      controls.length !== 2 ||
      !controls[0]?.matches('[data-theme-toggle]') ||
      !controls[1]?.matches('.language-switch')
    )
      add(
        'chrome-preference-order',
        'Appearance then language',
        '.site-preferences',
      );
    for (const control of controls) {
      const box = control.getBoundingClientRect();
      if (box.width < 44 || box.height < 44)
        add(
          'chrome-target',
          'Controls need a 44 px target',
          '.site-preferences',
        );
    }
    const box = preferences.getBoundingClientRect();
    if (Math.abs(box.width - 92) > 1)
      add(
        'chrome-preference-gap',
        'Use two 44 px targets and a 4 px gap',
        '.site-preferences',
      );
    if (logo) {
      const mark = logo.getBoundingClientRect();
      if (
        Math.abs(mark.y + mark.height / 2 - box.y - box.height / 2) > 1 ||
        mark.right + 16 > box.left
      )
        add(
          'chrome-identity-row',
          'Keep logo and preferences aligned without collision',
          '[data-site-header]',
        );
    }
  }
  const links = [...(footer?.querySelectorAll('a') ?? [])];
  if (links.length < 4)
    add(
      'chrome-footer-links',
      'Expected homepage, source, issue and license links',
      '[data-site-footer]',
    );
  else {
    if (links[0]?.getAttribute('href') !== 'https://vinasig.io.vn/')
      add(
        'chrome-footer-home',
        'Use the VINASIG homepage',
        '[data-site-footer]',
      );
    const source = links[1]?.getAttribute('href') ?? '';
    if (
      !/^https:\/\/github\.com\/VINASIG\/[^/]+(?:\/tree\/[^/]+)?\/?$/.test(
        source,
      )
    )
      add(
        'chrome-footer-source',
        'Use this product repository or deployed source revision',
        '[data-site-footer]',
      );
    const repository = source.match(
      /^https:\/\/github\.com\/VINASIG\/[^/]+/,
    )?.[0];
    if (
      !repository ||
      links[2]?.getAttribute('href') !== `${repository}/issues`
    )
      add(
        'chrome-footer-issues',
        'Use this product issue tracker',
        '[data-site-footer]',
      );
    const license = links[3];
    const label =
      document.documentElement.lang === 'vi' ? 'Giấy phép' : 'Licenses';
    if (
      license?.textContent?.trim() !== label ||
      new URL(license.getAttribute('href') ?? '', location.href).origin !==
        location.origin
    )
      add(
        'chrome-footer-license',
        'Use a localized local license destination',
        '[data-site-footer]',
      );
    for (const link of links)
      if (link.getBoundingClientRect().height < 44)
        add(
          'chrome-footer-target',
          'Footer links need a 44 px target',
          '[data-site-footer]',
        );
  }
  return findings;
}
