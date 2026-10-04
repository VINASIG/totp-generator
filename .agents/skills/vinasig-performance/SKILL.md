---
name: vinasig-performance
description: 'Measure and fix web loading or interaction performance using comparable reports and traces. Use for performance tasks or reproduced stutter.'
---

Read `.vinasig/standards/policies/performance.md`. Input includes production preview, routes, baseline/budgets and permitted measurement tools.

Build and serve production source. Record browser version, viewport, network/CPU, cache and fixture state. Run at least three comparable load measurements and preserve each report, median and variability. Include mobile/desktop and key interactions as relevant.

Use local Lighthouse CLI/CI for load/budget reports. Check actual category availability before using a MCP Lighthouse tool. Use Chrome DevTools traces for bottlenecks and compare the same setup after focused fixes.

Separate lab from real-user data, TBT from INP and URL from origin. Remote services and telemetry need approval for data transfer/collection. Keep cookies/source/private traces out of external reports. Do not game the audit, remove functionality or move heavy work to first click.

Output raw/summary metrics and their environment, causal evidence, changes and budget status. Field INP/CrUX is NOT_RUN or unavailable when no authorized field sample exists. A lab pass does not certify every user's experience.
