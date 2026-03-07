# psychometry

Static OSS-friendly psychometrics site focused on Ukrainian-localized tests.

## Product direction

- Hosting: static hosting such as GitHub Pages.
- App shape: small hash-routed SPA.
- Stack: `Vite + TypeScript`.
- Styling: handwritten CSS with a small token system.
- Data model: one JSON file per test, validated by JSON Schema.
- Rich text: Markdown allowed in selected JSON fields such as intro, instructions, warnings, and result descriptions.
- Scoring: entirely local in the browser.
- Persistence: full resumable session state encoded in the URL fragment so sharing the URL is enough to continue on another device.
- Governance: GitHub PR review plus CI validation.

## Why this shape

- Minimal infrastructure and operating cost.
- Easy OSS collaboration on both app code and test definitions.
- Strong static verification for AI-assisted development via strict TypeScript and schema validation.
- No backend required for privacy, reliability, or handoff.

## Important content constraint

This project should distinguish between:

- app infrastructure that is safe to build openly now
- test content that may require explicit permission to publish, translate, or modify

The current working assumption is that a Ukrainian psychologists body or similar expert group will validate correctness and licensing of test content before publication.

## First implemented instrument

The first interactive instrument in this repository is Beck Depression Inventory I in Ukrainian.

Current project assumption:

- the validated Ukrainian BDI-I translation is licensed for public reuse in this project
- the repository may publish the questionnaire text and scoring bands

See [docs/sources.md](/Users/zrslv/Dev/Vibe/psychometry/docs/sources.md) for source notes and provenance.

## Near-term implementation outline

1. Bootstrap the static SPA shell and catalog page.
2. Define `TestDefinition` and `SessionState` schemas.
3. Implement URL fragment encode/decode for resumable progress.
4. Add CI for TypeScript, schema validation, and scoring fixtures.
5. Refine Beck forms and add additional legally cleared test definitions.

## Deploy

- GitHub Pages deployment is configured via [deploy.yml](/Users/zrslv/Dev/Vibe/psychometry/.github/workflows/deploy.yml).
- The workflow runs on pushes to `main`, validates content, runs tests, builds the static bundle, and publishes `dist/`.
- For a new repository, enable GitHub Pages with source `GitHub Actions`.
