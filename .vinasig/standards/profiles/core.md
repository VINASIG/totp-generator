# Core profile

Use this profile for CLI, libraries, services and documentation without a web interface. Read core, language and quality policy. Use the project's existing language/build/test system. A Go service may use gofmt, go vet and appropriate tests; it need not install JavaScript tooling.

This installation supplies workflow and dependency skills and portable policies. It does not install browser packages, web assets, frameworks or global configuration. Web responsive, motion, SEO and browser accessibility checks are NOT_APPLICABLE only if the affected product has no web surface.

Add unit/integration/security/recovery checks according to actual risk. Change a profile explicitly when a web surface is introduced. Keep user language distinct from the technical repository language.
