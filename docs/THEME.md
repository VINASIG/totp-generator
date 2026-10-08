# Shared neutral appearance

The owner approved Radix Gray interface neutrals across all VINASIG websites on 8 October 2026. This project adopts the canonical [theme roles and contrast requirements](https://github.com/VINASIG/web-design-system/blob/06528b4b5dde7848998025b065fd1490bb541e69/docs/foundations/theme-colors.md). Source values are reviewed local CSS copies. No runtime package, network request or preference storage was added.

Light canvas is #F9F9F9 with #FCFCFC panels, #F0F0F0 muted surfaces, #202020 text and #646464 supporting text. Dark canvas is #111111 with #191919 panels, #222222 muted surfaces, #EEEEEE text and #B4B4B4 supporting text. Strong control boundaries use #838383 and #7B7B7B. Progress indicators use the existing derived VINASIG blue shades #17375F and #DCE7F2 so the remaining and depleted track stay distinguishable.

Ordinary text must reach 4.5:1. Meaningful icons, focus, control boundaries and state cues must reach 3:1 against actual adjacent colors. Quieter divider colors are reserved for decoration. Check placeholders and alpha compositing, both themes, manual overrides against the opposite system theme, both locales and script-disabled defaults. Existing browser tests continue to cover interactions, forced colors, accessibility and responsive layouts.

Identity anchors, source artwork, fonts, archive evidence and generated user files keep their original colors and bytes. Existing shared theme and language behavior, local processing and privacy restrictions are preserved. Use semantic tokens for new UI rather than adding warm backgrounds or fixed neutral foregrounds. A token table or an automated scan alone does not certify accessibility.
