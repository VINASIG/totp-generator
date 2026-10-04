# Browser-agent usability

AGENT-001 MUST distinguish discoverability, understandable controls and completion of permitted tasks. Semantic HTML, rendered readable content, accessible names/roles/states, predictable focus, stable layout and detectable success/errors form the baseline. Role/name based Playwright tests and axe checks help maintain it. They do not prove that an unfamiliar model understands the product.

AGENT-002 SHOULD run representative tasks in an independent session given only a URL and goal. Observe outcomes, retries and where it gets stuck. Do not provide source selectors or expected paths beforehand, force clicks or call hidden APIs to bypass unusable UI. Read source afterwards to fix a demonstrated issue. When an independent session is unavailable, describe the narrower deterministic test and mark the independent trial NOT_RUN.

Cloudflare readiness and Is Agentic are optional public scans. Is Agentic's read-only API/MCP retrieves completed reports and does not initiate a scan. Lighthouse Agentic Browsing is experimental in current official documentation and requires Chrome 150+ for that category; WebMCP checks also have preview/origin-trial requirements. It is an exploratory signal, not a release-wide numerical score.

Choose one browser driver available to the agent. Playwright Test is the persistent regression runner. Playwright CLI/skills, Playwright MCP or Vercel agent-browser are execution alternatives, not three compulsory dependencies. Chrome DevTools MCP adds diagnostics when needed.

Add Markdown endpoints, llms.txt, APIs, MCP or WebMCP only for a concrete consumer and a reviewed boundary. Preserve authentication, bot defenses, rate limits and sensitive action confirmations. Agent usability never authorizes opening a private service or weakening protection.
