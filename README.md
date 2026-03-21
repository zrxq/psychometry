# psychometry

Psychometry is a static, privacy-friendly Ukrainian psychometrics site. It serves self-report tests in a browser, computes results locally, and lets users share the finished result with a specialist without requiring a backend.

This repository is intentionally small and explicit. A new human contributor or LLM should be able to understand the product, run it locally, and make safe changes from this README plus [AGENTS.md](AGENTS.md).

## Product at a glance

- Audience: a wide public audience, including people with low technical literacy and elderly users.
- Primary language: Ukrainian.
- Current app shape: static hash-routed SPA hosted on GitHub Pages.
- Current implemented test: Beck Depression Inventory I in Ukrainian.
- Privacy model: scoring and session state stay in the browser; there is no backend.

## UX and accessibility principles

These are product requirements, not nice-to-haves.

- Avoid technical language in the user-facing UI. Terms like "URL fragment", "state token", or implementation details should not be shown to end users.
- Optimize for users who may have small screens, increased text size, reduced technical confidence, or limited familiarity with web forms.
- Keep the questionnaire flow simple: one question at a time, clear primary action, low cognitive load.
- Do not show incomplete scores or interpretations. Results are meaningful only after the test is finished.
- Keep secondary actions visible but not dominant.
- Prefer large tap targets, strong focus states, clear reading order, and semantic HTML.
- Preserve accessibility for keyboard and assistive technology users.
- When in doubt, reduce ambiguity and visual clutter before adding features.

## Tech stack

- App: `Vite`
- Language: `TypeScript`
- Tests: `Vitest`
- Styling: handwritten CSS in [`src/styles.css`](src/styles.css)
- Data: JSON test definitions in [`public/tests/`](public/tests)
- Validation: JSON schema plus [`scripts/validate-content.mjs`](scripts/validate-content.mjs)
- Deploy: GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

## Repository structure

- [`src/ui/app.ts`](src/ui/app.ts): main rendering and interaction flow
- [`src/lib/session.ts`](src/lib/session.ts): persisted session encoding/decoding and migration
- [`src/lib/scoring.ts`](src/lib/scoring.ts): local scoring logic
- [`src/lib/share.ts`](src/lib/share.ts): result sharing behavior
- [`src/types.ts`](src/types.ts): app and content types
- [`public/tests/catalog.json`](public/tests/catalog.json): catalog metadata
- [`public/tests/beck-bdi-i-uk.json`](public/tests/beck-bdi-i-uk.json): current test definition
- [`schemas/test-definition.schema.json`](schemas/test-definition.schema.json): content schema
- [`docs/sources.md`](docs/sources.md): provenance and source notes

## Local development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm test
npm run validate-content
npm run build
npm run preview
```

Default local URLs:

- dev server: usually `http://localhost:5173/`
- preview server: Vite will print the exact local URL

## How the app currently works

- Routing uses the hash, not server-side routes.
- The test flow has 3 phases:
  - intro
  - questionnaire
  - result
- Session progress is encoded into the shareable URL so the flow can be resumed or handed off without a backend.
- Result sharing uses the system share flow when available, with local fallback behavior in the browser.

Important implementation detail:

- The app may use a URL-based session mechanism internally, but the UI should present this in plain-language terms such as "share with a specialist" or "continue later" only when necessary.

## Content model and constraints

When editing test content:

- preserve the schema
- preserve the meaning of the scoring bands
- treat wording changes as product + clinical changes, not cosmetic edits
- update provenance notes when content sources change

## Guidance for new contributors

Start here if you are a new human or LLM working in this repo.

### What to understand first

1. Read this README.
2. Read [`src/ui/app.ts`](src/ui/app.ts) and [`src/types.ts`](src/types.ts).
3. Run `npm test` and `npm run build`.
4. If your work touches content or UX, inspect the current app locally before editing.

### When changing UX

- Test on narrow/mobile-sized viewports.
- Assume increased text size is possible.
- Be suspicious of any UI that requires precision taps or dense reading.
- Hide internal mechanics from end users.
- Make primary actions obvious and secondary actions quiet.

### When changing session or sharing logic

- Preserve compatibility with existing shared links whenever possible.
- Add or update tests in [`src/lib/session.test.ts`](src/lib/session.test.ts) for migrations and edge cases.
- Validate the final user flow in a browser, not only with typechecks.

### When changing content

- Run `npm run validate-content`.
- Check that JSON changes still match the schema and the UI renders correctly.
- Do not treat psychometric wording as generic copy.

## Deployment

- Pushes to `main` trigger the GitHub Pages workflow.
- CI runs:
  - `npm ci`
  - `npm run validate-content`
  - `npm test`
  - `npm run build`
- The built site is published from `dist/` through GitHub Actions Pages deployment.
