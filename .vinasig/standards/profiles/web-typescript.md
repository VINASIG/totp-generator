# TypeScript web profile

WEB-010 and `templates/web/ui-contract.md` are the common visible-change completion gate. Declare the product state matrix, map each reported defect to its regression and opened image, and repeat affected deployed states. Type checks and a default-mode screenshot cannot approve untested modes or interactions.

Extends [core](core.md) and shares web policy with static web. Use for a web product with TypeScript, including an existing React/Next.js/Vue stack. No profile migrates a product to one of those frameworks.

Use strict compiler options and typed ESLint with a real tsconfig/project service. Integrate framework-generated types and framework lint adapters, then Stylelint/custom syntax and generated-HTML validation where appropriate. The provided preset is tested on a small TypeScript web fixture. Framework-specific adapters have not been tested here and must be reviewed in their consumer.

Test server/client boundaries, promises, hydration, navigation, forms and business outcomes where relevant. Apply the same responsive/accessibility, motion, performance and discoverability evidence as static web. A TypeScript pass cannot replace a runtime flow.

New VINASIG websites apply WEB-009 before creating layouts. Read `templates/web/site-chrome.md`, reuse the reviewed shared source and add header/footer regressions within the existing browser infrastructure.

Before a new public website handoff, launch, host change or DNS/discovery repair, apply SEARCH-003 and read `templates/web/domain-discovery.md`. Review domain/DNS, live HTTPS and sitemap, then propose missing Cloudflare DNS or Search Console setup within task authorization. Keep already-correct setup and distinguish submission from indexing.

WEB-011 and `templates/web/shared-preferences.md` define system defaults and shared manual preferences. Reuse the reviewed local runtime, preserve active work, and run `checkSharedPreferences` against the real built artifact in all supported engines. Test interoperability with other actual VINASIG consumers before publication.

WEB-010 also requires semantic red and explicit data-destructive-action markers for actual deletion, session/input clearing and unsaved-edit discarding. Run inspectDestructiveActions with a declared inventory on enabled, hover, active, keyboard-focus, disabled and forced-colors states in every theme/locale, assert the actual discard outcome, and retain a rejecting blue-action fixture. Classify ordinary search/filter clearing, cancellation and copy-producing actions by their actual effect.
