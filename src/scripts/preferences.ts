const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const system = window.matchMedia('(prefers-color-scheme: dark)');
let saved: string | null = null;
try {
  saved = localStorage.getItem('vinasig-theme');
} catch {
  /* Storage can be unavailable. */
}
function applyTheme(): void {
  const dark = saved === 'dark' || (saved !== 'light' && system.matches);
  root.dataset['theme'] = dark ? 'dark' : 'light';
  for (const source of document.querySelectorAll<HTMLSourceElement>(
    '[data-brand-logo] source',
  ))
    source.media = dark ? 'all' : 'not all';
  if (toggle) {
    const label =
      root.lang === 'vi'
        ? dark
          ? 'Chuyển sang giao diện sáng'
          : 'Chuyển sang giao diện tối'
        : dark
          ? 'Switch to light theme'
          : 'Switch to dark theme';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.setAttribute('aria-pressed', String(dark));
  }
}
if (toggle) {
  toggle.addEventListener('click', () => {
    saved = root.dataset['theme'] === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('vinasig-theme', saved);
    } catch {
      /* The choice still applies to this page. */
    }
    applyTheme();
  });
  applyTheme();
  toggle.disabled = false;
}
system.addEventListener('change', applyTheme);
window.addEventListener('storage', (event) => {
  if (event.key === 'vinasig-theme') {
    saved = event.newValue;
    applyTheme();
  }
});

const languageLink =
  document.querySelector<HTMLAnchorElement>('.language-switch');
if (languageLink) {
  const alternatePage = languageLink.href;
  const keepSection = (): void => {
    const target = new URL(alternatePage);
    target.hash = window.location.hash;
    languageLink.href = target.href;
  };
  keepSection();
  window.addEventListener('hashchange', keepSection);
}

export {};
