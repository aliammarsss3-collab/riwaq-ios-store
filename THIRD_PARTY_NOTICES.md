# Upstream review and attribution

Reviewed 2026-09-28. Both projects are licensed under MIT. Original notices are included verbatim in `licenses/`.

| Project | Reviewed commit | Reuse |
| --- | --- | --- |
| [Nemesis-Surf/webipagui](https://github.com/Nemesis-Surf/webipagui) | `7590cb80badb27138a9b4f955bfa6145e09b82d6` | Version comparison adapted directly; flat/nested version normalization and bundle-based grouping adapted in `lib/catalog.mjs`. |
| [yazdipour/GithubStore](https://github.com/yazdipour/GithubStore) | `32ea74407f03f229294424b4c9f29ad24a315a31` | Latest-release IPA filtering, asset ranking and release-to-source mapping ported from Python to JavaScript in `lib/catalog.mjs` and `scripts/sync.mjs`. |

Original webipagui is a browser-only HTML/CSS/JavaScript catalog. GithubStore is a Python/FastAPI service with optional configuration UI, Docker deployment and metadata caching. This repository integrates adapted core behavior into a dependency-free Node.js scheduled static build; it does not run those upstream applications unchanged.

Changes: new Arabic RTL interface, category filters, shareable hash detail routes, configuration generator, per-app permission allowlist, exact download host allowlist, restricted metadata transport, isolated source failures, GitHub Pages workflow. No upstream recommended source list, installer integrations, default application assets or IPA binaries were copied. GitHub release bundle identifiers must be supplied by the operator, replacing upstream's synthetic identifiers. Only one explicitly matched asset per approved app is accepted, avoiding accidental debug/alternate build publication.

Software licenses authorize reuse of the respective software, not redistribution of third-party apps appearing in a feed. The permission fields are an operator declaration and audit reference, not an automated legal determination. Review binary redistribution terms, trademarks and third-party bundled assets separately. A public GitHub repository alone is not distribution permission.

Copies of upstream licenses:
- `licenses/webipagui-MIT.txt`: Copyright (c) 2026 Nemesis.Surf.
- `licenses/GithubStore-MIT.txt`: Copyright (c) 2023 Shahriar.

No runtime npm dependencies, external fonts, analytics, signing certificates or third-party application binaries are included.
