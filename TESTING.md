# Verification — 2026-09-28

- `node --test`: 13 automated tests passed. Covers permission requirements, malformed/duplicate configuration, app allowlists, download host checks, flat and nested AltStore schemas, deduplication and provenance, GitHub release mapping, ambiguous/no IPA rejection, private address rejection, partial failures, revocation and empty configuration.
- `node scripts/build.mjs`: static build passed. `node --check public/app.js`: syntax passed.
- Live metadata transport: `fetchJSON` successfully retrieved the public GithubStore repository metadata from GitHub over HTTPS. No application binaries were fetched.
- Desktop browser: empty catalog renders correctly; demo shows six clearly labeled fictional apps; searching دفتر returns one result; detail view renders metadata and disabled demo download; configuration form accepted a fictional local test entry and removal cleared the draft. These test entries were not saved to the repository configuration.
- Mobile browser: visually checked at 390 × 844; header, search, filters and empty state fit the viewport. No horizontal overflow observed.

Not tested: real iPhone installation/signing; a production feed containing user-owned apps (none supplied); every external source schema; IPv6-only endpoints. A release tag need not equal the IPA internal version, so verify published app metadata with the developer before offering an install source.

Re-run `npm test` after changing normalization, permission rules or transport. To test your first real source, run `npm run sync`, inspect `public/data/catalog.json` and the Sources page, then verify bundle ID, version and source export in the intended installation tool.
