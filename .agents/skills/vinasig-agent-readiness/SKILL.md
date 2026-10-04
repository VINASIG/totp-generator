---
name: vinasig-agent-readiness
description: 'Evaluate public content and permitted browser tasks for SI-agent usability. Use for agent-readiness work, not ordinary SEO or accessibility-only changes.'
---

Read `.vinasig/standards/policies/agent-readiness.md`. Inputs are URLs, permitted user goals, sandbox/fixture boundaries and available browser tools.

Separate discovery, control understanding and task completion. Review semantic roles/names/states, accessibility-tree content, stable layout and visible feedback with Playwright/axe and actual interaction.

For an independent trial provide only URL and goal to a fresh authorized session. Keep source/selectors/expected route hidden until outcomes are recorded. Observe task success, retries and sticking points. Never force-click or call a hidden API to make the UI pass. Fix source afterwards and add deterministic regression flows.

Use a single browser driver available in the environment. Vercel agent-browser is an alternative, not compulsory next to Playwright MCP/CLI. Chrome DevTools adds diagnostics. Public readiness scans and experimental Lighthouse Agentic Browsing are optional; verify capability and data sharing first.

Output task outcomes, evidence and limitations. Mark independent trial NOT_RUN if unavailable. Do not add WebMCP/llms.txt without a consumer need or weaken authentication, CAPTCHA, rate limits or sensitive-action confirmation.
