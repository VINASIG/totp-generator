# TypeScript web profile

Extends [core](core.md) and shares web policy with static web. Use for a web product with TypeScript, including an existing React/Next.js/Vue stack. No profile migrates a product to one of those frameworks.

Use strict compiler options and typed ESLint with a real tsconfig/project service. Integrate framework-generated types and framework lint adapters, then Stylelint/custom syntax and generated-HTML validation where appropriate. The provided preset is tested on a small TypeScript web fixture. Framework-specific adapters have not been tested here and must be reviewed in their consumer.

Test server/client boundaries, promises, hydration, navigation, forms and business outcomes where relevant. Apply the same responsive/accessibility, motion, performance and discoverability evidence as static web. A TypeScript pass cannot replace a runtime flow.
