# Shared VINASIG appearance and language

Apply WEB-011 together with WEB-009. The owner requested ecosystem-wide preferences on 7 October 2026. Use the reviewed, dependency-free `web-design-system/src/scripts/shared-preferences.js`, copied with its normalized-LF SHA-256 into the consumer's source record. Keep every consuming copy identical. Do not load this code from a remote service at runtime.

## Resolution and storage

- Before a manual appearance choice, follow `prefers-color-scheme` and subsequent system changes. Use light when the API is unavailable. Do not infer appearance from the clock or location.
- At a default-language entrypoint, use the first supported `navigator.languages` entry, then `navigator.language`. Supported languages are Vietnamese and English. An unavailable or unsupported language falls back to English. Preserve independently accessible explicit locale URLs, canonical metadata and reciprocal hreflang. A stored manual language choice overrides the entrypoint or explicit route.
- A deliberate theme or language control action creates only its own preference. On HTTPS `vinasig.io.vn` or a real subdomain, use `__Secure-vinasig-theme` with `light` or `dark`, and `__Secure-vinasig-language` with `vi` or `en`. Set `Domain=vinasig.io.vn`, `Path=/`, `Secure`, `SameSite=Lax` and a maximum age of one year. These finite settings are not credentials or identifiers. Never put content, measurements, files, passwords, keys, timestamps or browsing history in them.
- No default detection writes a preference. A legacy valid `vinasig-theme` is an existing manual choice and may be migrated once. A valid shared cookie takes precedence over an older origin-local value. Remove the migrated local copy after a verified successful cookie write.
- Local development, downloaded files and blocked cookies keep optional origin-local `vinasig-theme` and `vinasig-language` fallbacks. When all storage is blocked, controls still work in the current page. Do not promise cross-site persistence in that case or across different browser profiles or devices.
- Reject unknown values, ambiguous duplicate cookies, lookalike hostnames and foreign-domain writes. A shared preference never grants authorization or changes a secret-generation distribution.

## Open pages and product state

Update appearance without navigation and retain the approved Sun/Moon action, accessible name, pressed state and original logo choice. Observe shared cookie changes where supported, with focus/pageshow/visibility resynchronization and a bounded visible-page fallback. Suspend polling while hidden and stop it on pagehide. Do not fetch a preference API, iframe, remote script or translation.

Language navigation uses the declared equivalent page and remains a native link without JavaScript. A change elsewhere may update a pristine open page. Defer automatic navigation on a page where the user has interacted with a form, file or result, so synchronization cannot discard ongoing work. Its next load applies the shared language. An explicit language-link action follows the user's requested navigation. Preserve section fragments and existing product-specific query/privacy rules. Do not persist product state to make language switching appear seamless.

## Required evidence

Test real shared cookies between distinct HTTPS subdomains in Chromium, Firefox and WebKit. Include system defaults and changes, two-way manual propagation, late-opened and already-open pages, browser-language precedence, explicit locale URLs, legacy migration, denied storage, malformed values, lookalike domains, script-unavailable links and protected active input. Assert cookie scope and attributes, finite values, absence of secret/content storage, unchanged chrome/artwork and no preference network service. Check the actual deployed consumers, not only a single origin or the source variable name. Capture and open both themes and locales, the header and footer, narrow and desktop states.

Use `checkSharedPreferences` from `shared-preferences.mjs` with the consumer's real built server. Its HTTPS origins are browser-intercepted fixtures that serve the same reviewed local artifact, rather than external production writes. An additional ecosystem test must cover different actual consumers before claiming ecosystem-wide publication.
