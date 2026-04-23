# Architecture Overview

This repo is structured as a layered Playwright automation framework rather than a flat collection of specs.

## Test Layers

- `tests/api/`
  - validates public service contracts directly through API clients
- `tests/ui/`
  - validates user-facing browser flows and presentation behavior
- `tests/integration/`
  - uses API state as setup or source of truth, then verifies what the UI exposes
- `tests/setup/`
  - prepares reusable authenticated browser state for selected projects

The intent is to keep fast contract checks, browser coverage, and cross-layer consistency checks separated so failures are easier to localize.

## Project Model

- `api`
  - request-level execution against the public API
- `chromium`
  - public unauthenticated browser coverage
- `firefox`
  - secondary browser coverage for selected UI regression paths
- `setup-auth`
  - one-time login/setup project that writes `auth/user.json`
- `chromium-auth`
  - authenticated browser coverage that reuses stored session state

Projects represent runtime context. Tags represent test intent.

## Tag Strategy

- `@smoke`
  - critical-path coverage
- `@regression`
  - broader functional or non-critical-path checks
- `@auth`
  - tests that require authenticated state or private credentials
- `@ui`
  - browser-facing coverage marker used for organization and filtering

Execution is intentionally the combination of tags and projects rather than tags alone.

Examples:

- `npm run test:public-smoke`
  - runs public smoke coverage without credentials
- `npm run test:auth-smoke`
  - runs the intersection of `@smoke` and `@auth`

## Auth Boundaries

- Public smoke is designed to run without `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
- Auth-required coverage is isolated into a separate lane
- Stored session reuse avoids repeated UI logins for authenticated smoke

This keeps the portfolio path easy to run while still demonstrating authenticated automation strategy.

## Defect Philosophy

Known product issues are documented, not hidden.

Current example:

- `tests/integration/cart-api-ui.spec.ts`
  - quarantined with `test.fixme()`
  - retained as a documented API-to-UI consistency defect case study

The goal is to preserve signal without letting a known product defect break the public portfolio path.

## Triage Philosophy

Failure diagnosis is layered:

1. Playwright produces deterministic artifacts:
   - HTML report
   - JUnit
   - traces
   - screenshots
   - videos
2. Repo-native triage helpers summarize failures and map tests by tag
3. Optional AI-assisted CI triage generates a markdown summary when configured
4. Manual browser verification can be performed with `playwright-cli` when artifacts alone do not separate test issues from product behavior

This deterministic-first, AI-second approach is deliberate. AI augments evidence; it does not replace it.
