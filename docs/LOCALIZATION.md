# Language and appearance

The independently rendered locale pages keep their canonical and reciprocal hreflang URLs. Use the native header link to open the equivalent page.

## Preferences and privacy

The initial appearance follows the operating system and subsequent system changes, with light as the unavailable-API fallback. The default-language entrypoint uses the first supported browser/system language (Vietnamese or English), falling back to English. Independently linked explicit locale pages stay available when no manual language choice exists.

Deliberate theme and language choices are shared across HTTPS `vinasig.io.vn` and its subdomains using `__Secure-vinasig-theme` (`light`/`dark`) and `__Secure-vinasig-language` (`vi`/`en`). Each cookie has Domain=vinasig.io.vn, Path=/, Secure, SameSite=Lax and a one-year maximum age. Detected defaults write nothing. These are finite essential preferences, without identifiers or tracking. A valid older origin-local preference is migrated only if no shared preference exists. The shared cookie takes precedence and a successful migration removes the local copy.

Theme changes update open tabs without navigation. A language change from another tab navigates only an untouched page; trusted form, result, paste or drop interaction defers navigation until the next load. Explicit language links still navigate immediately. Section fragments are retained; queries and product state are not copied or persisted. Without JavaScript, native locale links remain available and appearance uses CSS system defaults.

Cookie denial, local development and downloaded files use optional origin-local `vinasig-theme`/`vinasig-language` fallback values. If storage is entirely blocked, the controls still work for the current page. Cross-site persistence applies within one browser profile; it cannot synchronize different devices, profiles or denied-cookie contexts.

No file, measurement, password, generator setting, secret, activity history or user content is stored or transmitted by this preference runtime. There is no preference API, iframe, remote script or translation request. Language navigation starts a fresh page; appearance changes preserve the existing inputs and results.

## Shared-runtime verification

`checkSharedPreferences` exercises the actual built artifact under distinct controlled HTTPS subdomains in Chromium, Firefox and WebKit. The reviewed local source and normalized-LF SHA-256 are recorded in [SHARED_PREFERENCES.json](SHARED_PREFERENCES.json). Apply WEB-011 and its installed contract. An ecosystem interoperability check uses different actual consumers; local fixtures do not certify live deployment.
