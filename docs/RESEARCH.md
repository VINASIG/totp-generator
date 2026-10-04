# Primary-source research

Reviewed on 5 October 2026.

- [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238), sections 4-6 and Appendix B, defines the time counter, shared step, SHA1/SHA256/SHA512 HMAC alternatives, 30-second default and the interoperability vectors. The counter must support time beyond 2038. A validator owns acceptance and prevention of reuse.
- [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226), section 5 and Appendix D, defines the eight-byte moving factor, dynamic truncation, decimal reduction and leading-zero preservation.
- [Google Authenticator Key URI Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format) documents Base32 secrets, label/issuer, TOTP versus HOTP, and the algorithm, digits and period parameters. Historical notes on older apps are not a current compatibility claim for every authenticator.
- [Web Cryptography specification](https://www.w3.org/TR/webcrypto/) provides browser HMAC import/sign operations. This implementation writes its own small Base32/parser/truncation logic and uses the browser's cryptographic primitive rather than a new cryptographic dependency.

The test expectations are standards data. No reference implementation source was copied. Six timestamps and three algorithm-specific secret lengths cover all 18 RFC 6238 test vectors, including a timestamp in year 2603. An independent Node createHmac reference checks selected combinations of algorithm, period and offset.

The 1-300 second period and -300 to 300 second offset are explicit product bounds. They are not additional RFC requirements. A short secret is accepted for interoperability with provisioned services. This tool does not generate secrets or claim an assurance level for a service's chosen key.
