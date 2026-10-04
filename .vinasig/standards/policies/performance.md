# Web performance

PERF-001 MUST establish a production-build baseline and compare before/after with the same browser, viewport, throttling, cache policy and fixture data. Measure representative loads at least three times, retain raw reports and use the median and variability. Test mobile/desktop, initial/repeat visits and meaningful interactions as relevant. Do not claim a real-user result from localhost.

PERF-002 SHOULD use Lighthouse CLI/CI for repeatable lab budgets and Chrome DevTools traces for root cause. Default provisional budgets for small static fixtures are LCP <= 2500 ms, CLS <= 0.1 and TBT <= 200 ms under a recorded lab setup. Real products should review representative baselines and deployment constraints before adopting a budget. Raising a budget requires evidence and an approved policy change.

Current good Core Web Vitals field targets at the 75th percentile are LCP <= 2.5 s, INP <= 200 ms and CLS <= 0.1, assessed separately for mobile/desktop. Lab TBT is not field INP. Distinguish URL from origin data and report missing CrUX samples honestly.

Lighthouse's DevTools MCP tool currently documents accessibility, SEO, best-practices and agentic audits. Check its actual supported categories before assuming it measures Performance. The local Lighthouse CLI covers performance independently.

PageSpeed Insights and public WebPageTest send URLs/results to external services. web-vitals can measure interactions locally; an endpoint/telemetry collection is a separate authorized product choice. Never leak private cookies or traces. Do not remove content/security, move heavy work to the first click or detect Lighthouse to improve a score. Optimize measured bottlenecks and keep behavior intact.
