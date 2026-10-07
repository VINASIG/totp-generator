# Primary-source research

Reviewed on 5 October 2026.

- [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238), sections 4-6 and Appendix B, defines the time counter, shared step, SHA1/SHA256/SHA512 HMAC alternatives, 30-second default and the interoperability vectors. The counter must support time beyond 2038. A validator owns acceptance and prevention of reuse.
- [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226), section 5 and Appendix D, defines the eight-byte moving factor, dynamic truncation, decimal reduction and leading-zero preservation.
- [Google Authenticator Key URI Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format) documents Base32 secrets, label/issuer, TOTP versus HOTP, and the algorithm, digits and period parameters. Historical notes on older apps are not a current compatibility claim for every authenticator.
- [Web Cryptography specification](https://www.w3.org/TR/webcrypto/) provides browser HMAC import/sign operations. This implementation writes its own small Base32/parser/truncation logic and uses the browser's cryptographic primitive rather than a new cryptographic dependency.

The test expectations are standards data. No reference implementation source was copied. Six timestamps and three algorithm-specific secret lengths cover all 18 RFC 6238 test vectors, including a timestamp in year 2603. An independent Node createHmac reference checks selected combinations of algorithm, period and offset.

The 1-300 second period and -300 to 300 second offset are explicit product bounds. They are not additional RFC requirements. A short secret is accepted for interoperability with provisioned services. This tool does not generate secrets or claim an assurance level for a service's chosen key.

## Sharing and key-field semantics

Reviewed on 7 October 2026.

- [jaden/totp-generator](https://github.com/jaden/totp-generator#private-key) supports secret-bearing query and fragment links with additional settings. Its requested behavior is a comparator, not a confidentiality proof. No implementation source or dependency was copied. VINASIG uses only a fragment export, with strict versioned parsing and explicit credential disclosure.
- [RFC 3986 section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) specifies that a fragment is separated before resource dereferencing and handled by the user agent. [MDN's URI fragment reference](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment) explains the corresponding HTTP behavior. This supports avoiding request/query leakage. It does not make a bearer link confidential against browser history, synchronization or its recipients.
- [RFC 6238 requirements and security considerations](https://www.rfc-editor.org/rfc/rfc6238#section-3) require protecting TOTP keys against unauthorized access and usage. Sharing a key deliberately transfers code-generation capability. A static site cannot revoke a recipient's retained copy or enforce one-time use of a key-bearing link.
- [RFC 4648 sections 3.5, 6 and 10](https://www.rfc-editor.org/rfc/rfc4648) define canonical Base32 and the published encoding vectors. The export encoder is checked against those literals and a separately implemented bit-string reference. The provisioning convention omits padding, with zero trailing bits still mandatory.
- [Chromium's password-form guidance](https://new.chromium.org/developers/design-documents/create-amazing-password-forms/) assigns new-password to registration/change-password fields. The previous TOTP input incorrectly used that purpose. Text-field semantics and autocomplete off remove that declaration. [CSS visual text masking](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-text-security) is nonstandard, so support is measured in the three pinned browser engines and unsupported engines retain a native masking fallback. Browser-manager heuristics and user-installed extensions are not fully controlled by these attributes.

The separately encrypted link with an out-of-band unlock key was considered. The owner selected direct bearer links. Merely encrypting a secret with a key included in that same link does not reduce link-holder capability, so no such cosmetic encryption was added. See [the decision and evidence matrix](audits/share-decision-2026-10-07.md).
