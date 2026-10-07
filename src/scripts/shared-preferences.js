// @ts-check
// SPDX-License-Identifier: AGPL-3.0-or-later
(() => {
  const root = document.documentElement;
  if (root.dataset["preferencesInstalled"] === "true") return;
  root.dataset["preferencesInstalled"] = "true";

  /** @typedef {'theme' | 'language'} Kind */
  const settings = {
    theme: {
      cookie: "__Secure-vinasig-theme",
      storage: "vinasig-theme",
      values: ["light", "dark"],
    },
    language: {
      cookie: "__Secure-vinasig-language",
      storage: "vinasig-language",
      values: ["vi", "en"],
    },
  };
  const shared =
    location.protocol === "https:" &&
    (location.hostname === "vinasig.io.vn" ||
      location.hostname.endsWith(".vinasig.io.vn"));
  /** @type {Record<Kind, string | null>} */
  const memory = { theme: null, language: null };
  let ready = false;
  let busy = false;
  let redirecting = false;
  /** @type {number | undefined} */
  let timer;
  /** @type {MediaQueryList | null} */
  let system = null;
  try {
    system = window.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    /* Light is the unavailable-system fallback. */
  }

  /** @param {Kind} kind @param {string | null} value */
  function valid(kind, value) {
    return value !== null &&
      settings[kind].values.some((item) => item === value)
      ? value
      : null;
  }
  /** @param {Kind} kind */
  function cookie(kind) {
    if (!shared) return null;
    try {
      const prefix = `${settings[kind].cookie}=`;
      const values = document.cookie
        .split(";")
        .map((item) => item.trim())
        .filter((item) => item.startsWith(prefix))
        .map((item) => item.slice(prefix.length));
      return values.length === 1 ? valid(kind, values[0] ?? null) : null;
    } catch {
      return null;
    }
  }
  /** @param {Kind} kind */
  function local(kind) {
    try {
      return valid(kind, window.localStorage.getItem(settings[kind].storage));
    } catch {
      return null;
    }
  }
  /** @param {Kind} kind */
  function preference(kind) {
    return cookie(kind) ?? local(kind) ?? memory[kind];
  }
  /** @param {Kind} kind @param {string} value */
  function save(kind, value) {
    if (valid(kind, value) === null) return;
    memory[kind] = value;
    if (shared) {
      try {
        document.cookie = `${settings[kind].cookie}=${value}; Domain=vinasig.io.vn; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
        if (cookie(kind) === value) {
          memory[kind] = null;
          try {
            window.localStorage.removeItem(settings[kind].storage);
          } catch {
            /* The shared cookie is authoritative. */
          }
          return;
        }
      } catch {
        /* A blocked cookie keeps a local preference. */
      }
    }
    try {
      window.localStorage.setItem(settings[kind].storage, value);
    } catch {
      /* The current page still works. */
    }
  }
  for (const kind of /** @type {const} */ (["theme", "language"])) {
    const stored = local(kind);
    if (shared && cookie(kind) !== null) {
      try {
        window.localStorage.removeItem(settings[kind].storage);
      } catch {
        /* Ignore unavailable storage. */
      }
    } else if (shared && stored !== null) save(kind, stored);
  }

  function applyTheme() {
    const stored = preference("theme");
    const dark =
      stored === "dark" || (stored !== "light" && system?.matches === true);
    const theme = dark ? "dark" : "light";
    const changed = root.dataset["theme"] !== theme;
    root.dataset["theme"] = theme;
    const button = document.querySelector("[data-theme-toggle]");
    if (button instanceof HTMLButtonElement) {
      const label =
        root.lang === "vi"
          ? dark
            ? "Chuyển sang giao diện sáng"
            : "Chuyển sang giao diện tối"
          : dark
            ? "Switch to light theme"
            : "Switch to dark theme";
      button.setAttribute("aria-label", label);
      button.title = label;
      button.setAttribute("aria-pressed", String(dark));
    }
    if (changed || !ready) {
      for (const source of document.querySelectorAll(
        "[data-brand-logo] source",
      ))
        source.setAttribute("media", dark ? "all" : "not all");
      root.dispatchEvent(
        new CustomEvent("vinasig:theme", { bubbles: true, detail: theme }),
      );
    }
  }
  function browserLanguage() {
    try {
      /** @type {unknown} */
      const observed = Reflect.get(navigator, "languages");
      /** @type {readonly unknown[]} */
      const languages =
        Array.isArray(observed) && observed.length > 0
          ? observed
          : [navigator.language];
      for (const language of languages) {
        if (typeof language !== "string") continue;
        const base = language.toLowerCase().split("-")[0];
        if (base === "vi" || base === "en") return base;
      }
    } catch {
      /* Unsupported or unavailable languages use English. */
    }
    return "en";
  }
  /** @param {string} language */
  function languageTarget(language) {
    if (
      !["vi", "en"].includes(language) ||
      !["http:", "https:"].includes(location.protocol)
    )
      return null;
    const link = document.querySelector(
      `link[rel="alternate"][hreflang="${language}"]`,
    );
    if (!(link instanceof HTMLLinkElement)) return null;
    const declared = new URL(link.href);
    if (!["http:", "https:"].includes(declared.protocol)) return null;
    const target = new URL(declared.pathname, location.origin);
    target.hash = location.hash;
    return target;
  }
  /** @param {boolean} initial */
  function applyLanguage(initial) {
    if (redirecting) return;
    const stored = preference("language");
    const language = stored ?? browserLanguage();
    root.dataset["preferredLanguage"] = language;
    if (language === root.lang) return;
    const target = languageTarget(language);
    if (target === null || target.pathname === location.pathname) return;
    if (stored === null) {
      const primary = document.querySelector(
        'link[rel="alternate"][hreflang="x-default"]',
      );
      if (
        !(primary instanceof HTMLLinkElement) ||
        new URL(primary.href).pathname !== location.pathname
      )
        return;
    }
    if (!initial && busy) {
      root.dataset["languagePending"] = language;
      return;
    }
    redirecting = true;
    root.dataset["preferencesRedirecting"] = "true";
    location.replace(target.href);
  }
  function sync() {
    applyTheme();
    if (ready) applyLanguage(false);
  }
  function watch() {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    if (!document.hidden) timer = window.setInterval(sync, 1000);
  }
  function setup() {
    const button = document.querySelector("[data-theme-toggle]");
    if (button instanceof HTMLButtonElement) {
      button.addEventListener("click", (event) => {
        if (!event.isTrusted) return;
        save("theme", root.dataset["theme"] === "dark" ? "light" : "dark");
        applyTheme();
      });
      button.disabled = false;
    }
    const link = document.querySelector(".language-switch");
    if (link instanceof HTMLAnchorElement) {
      const alternate = link.href;
      const section = () => {
        const target = new URL(alternate);
        target.hash = location.hash;
        link.href = target.href;
      };
      section();
      window.addEventListener("hashchange", section);
      link.addEventListener("click", (event) => {
        if (
          event.isTrusted &&
          !event.defaultPrevented &&
          valid("language", link.hreflang) !== null
        )
          save("language", link.hreflang);
      });
    }
    for (const name of ["input", "change", "pointerdown"]) {
      document.addEventListener(
        name,
        (event) => {
          const target = event.target;
          if (
            !event.isTrusted ||
            !(target instanceof Element) ||
            target.closest(".site-preferences")
          )
            return;
          if (
            target.closest(
              'input, textarea, select, button, [contenteditable="true"]',
            )
          )
            busy = true;
        },
        { capture: true, passive: true },
      );
    }
    for (const name of ["drop", "paste"]) {
      document.addEventListener(
        name,
        (event) => {
          if (event.isTrusted) busy = true;
        },
        { capture: true, passive: true },
      );
    }
    applyTheme();
    applyLanguage(true);
    ready = true;
    root.dataset["preferencesReady"] = "true";
    watch();
  }
  applyTheme();
  system?.addEventListener("change", applyTheme);
  window.addEventListener("storage", (event) => {
    if (
      event.key === null ||
      event.key === "vinasig-theme" ||
      event.key === "vinasig-language"
    )
      sync();
  });
  window.addEventListener("focus", sync);
  window.addEventListener("languagechange", sync);
  window.addEventListener("pageshow", () => {
    sync();
    if (ready) watch();
  });
  window.addEventListener("pagehide", () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) sync();
    if (ready) watch();
  });
  /** @type {unknown} */
  const store = Reflect.get(window, "cookieStore");
  if (store instanceof EventTarget) store.addEventListener("change", sync);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
