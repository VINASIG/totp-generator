# Verification coverage

Unit tests check every RFC 6238 vector, RFC 4226 counters, leading zeroes, post-2038 counters, Base32 padding and canonical bits, parsing failure modes, period boundaries, offsets and an independent HMAC reference.

Browser tests run production HTML with its CSP in Chromium, Firefox and WebKit. Fixtures check automatic calculation and rollover, masking, inline validation/recovery, reset, settings import, no requests/storage during input, loaded-page operation offline, clipboard success/failure, delayed cryptography after Clear, script-unavailable initial controls, keyboard radios, forced colors and persisted optional themes.

Responsive coverage includes both locales/themes at 320, 360, 390, 600, 759, 760, 761, 768, 1024 and 1440 CSS pixels, with 200% text at 320. The standard five viewport families, breakpoint neighbors, open disclosures, scroll to final content and actual control inventory are covered. InspectInterface, inspectControlSurfaces and inspectHeaderBrand run on initial and populated states. Dropdown indicators are NOT_APPLICABLE because no dropdown exists. Axe provides partial automated accessibility coverage at mobile and desktop sizes.

Screenshots and traces live under ignored output/. Screenshots must be opened before reporting visual verification. Synthetic clipboard paths do not establish native clipboard permissions for every platform. Real physical devices, screen readers, field performance and an independent SI-agent trial are NOT_RUN unless separately observed.
