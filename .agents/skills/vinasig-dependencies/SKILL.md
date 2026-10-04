---
name: vinasig-dependencies
description: 'Select or upgrade dependencies using current stable releases, compatibility checks and pinned versions. Use for dependency changes, not unrelated edits.'
---

Read `.vinasig/standards/policies/quality.md` and `tools.lock.json`. Input includes the manifest, lockfile, runtime and a concrete dependency need.

Verify latest stable from official registry/releases and the framework's migration/peer requirements. Compare installed, latest and selected versions. Check runtime, browser/support targets, license, package source and expected payload.

Use the current package manager. Pin the selected version and lock its dependency graph. Prefer a supported compatible runtime. Record why latest cannot be used; don't force incompatible peers or use remembered versions. Keep existing major upgrades separate from unrelated bug fixes.

Run the affected quality/runtime checks and review lockfile churn. Output a dated selection record, migrations, evidence and PASS/FAIL/NOT_RUN results. One update bot may propose changes; it must not silently merge major or sensitive upgrades. Publishing, registry authentication and global tooling changes need authorization. An offline run may use installed locks but must label an unverified latest version.
