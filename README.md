![CI](https://github.com/ishabhatt/playwright-toolshop-framework/actions/workflows/playwright.yml/badge.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.58-45ba4b)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)

# Playwright Sample Shop Framework

Playwright automation framework built with **TypeScript** for the [Practice Software Testing Toolshop](https://practicesoftwaretesting.com) application and its public API.

## Start Here

Run this first:

```bash
npm run test:public-smoke
```

This is the default public smoke path:

- credential-free
- green in CI
- covers public API and browser smoke flows

What this repo demonstrates:

- layered Playwright architecture across API, UI, and integration tests
- reusable fixtures, page objects, and API clients
- project/tag strategy for public versus authenticated coverage
- diagnosable CI with deterministic artifacts and targeted triage tooling

Why it is different:

- deterministic triage first through JUnit, traces, screenshots, videos, and repo-native helper scripts
- optional AI-assisted CI failure analysis as a second diagnostic layer
- documented product-defect handling instead of silently deleting unstable coverage

Architecture overview:

- [docs/architecture-overview.md](docs/architecture-overview.md)

## Highlights

- UI testing
- API testing
- Hybrid API + UI validation
- Page Object Model
- Reusable fixtures
- Auth reuse via storage state
- Network mocking
- Visual regression testing
- Accessibility snapshots
- HTML / JUnit reporting
- GitHub Actions CI

## Tech Stack

- Playwright
- TypeScript
- Node.js
- GitHub Actions

## Project Structure

```text
playwright-sample-shop/
├── api-clients/
├── components/
├── config/
├── fixtures/
├── pages/
├── tests/
│   ├── api/
│   ├── integration/
│   ├── setup/
│   └── ui/
├── utils/
├── playwright.config.ts
└── .github/workflows/playwright.yml
```

## Key Test Coverage

### UI

- home page smoke
- login page structure
- category navigation
- authenticated smoke
- mocked product listing
- visual header regression
- ARIA snapshot validation

### API

- products: smoke, pagination, sorting, price filtering, 404 negative path
- brands: smoke
- auth: valid login (200), invalid credentials (401 negative test)
- cart: add to cart, retrieve cart

### Integration

- API-selected product validated in UI
- capstone product consistency flow

## Known Product Defect

One integration scenario is intentionally quarantined with `test.fixme()`:

- `tests/integration/cart-api-ui.spec.ts`

Observed behavior:

- a cart created successfully via API for a newly registered user does not appear in the checkout UI after logging in through the browser
- the app throws a checkout-side `cart_items` null error during manual verification
- the header also does not expose the expected `data-test="nav-cart"` control used by the original test

Why this is kept:

- it documents a real product/API-to-UI consistency issue discovered by the framework
- it keeps the public smoke path green for portfolio review
- it preserves the scenario as a defect case study rather than silently deleting coverage

## How to Run

Install dependencies:

```bash
npm install
npx playwright install
```

Create a local `.env`:

```env
WEB_BASE_URL=https://practicesoftwaretesting.com
API_BASE_URL=https://api.practicesoftwaretesting.com
TEST_USER_EMAIL=your_test_email_here
TEST_USER_PASSWORD=your_test_password_here
```

Public smoke does not require `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`.
Those credentials are only required for auth-dependent coverage.

Run all tests:

```bash
npm test
```

Run UI only:

```bash
npm run test:ui
```

This runs Chromium and Firefox browser coverage and may include auth-tagged UI tests.
If `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are not configured, prefer `npm run test:public-smoke` for a credential-free browser path.

Run API only:

```bash
npm run test:api
```

Run smoke tests:

```bash
npm run test:smoke
```

Canonical public smoke command:

```bash
npm run test:public-smoke
```

Use this as the default portfolio/demo entry point.

Run public smoke only:

```bash
npm run test:public-smoke
```

Run auth-dependent smoke:

```bash
npm run test:auth-smoke
```

Open the HTML report:

```bash
npm run test:report
```

## Quality & Triage Commands

Static quality checks:

```bash
npm run lint
npm run typecheck
npm run format:check
```

Local formatting:

```bash
npm run format
```

Deterministic triage helpers:

```bash
npm run triage:list-tests
npm run triage:list-tests -- --tag=@smoke
npm run triage:failures
```

## AI-Assisted Failure Analysis

The core framework does not depend on an LLM provider to execute tests or diagnose failures.
Standard Playwright artifacts remain the primary source of truth:

- HTML report
- JUnit output
- traces, screenshots, and videos
- deterministic triage helpers such as `npm run triage:failures`

An optional CI-only AI triage step is attempted only on failed workflows and produces a report when provider keys are configured.
Its purpose is to accelerate diagnosis by:

- grouping failures by likely shared root cause
- suggesting whether the issue looks like product behavior, test code, or environment
- writing a human-readable markdown summary to `test-results/ai-failure-analysis.md`

This is positioned as a diagnostic extension, not a replacement for deterministic reporting.

Example report excerpt:

```md
# AI Failure Analysis Report

## SUMMARY
- cart-api-ui.spec.ts -> likely product/API-to-UI cart consistency defect

## ROOT CAUSE GROUPS
- Selector/test code: expected nav-cart control is absent
- Product/API behavior: API-created cart state is not rendered in checkout

## RECOMMENDED ACTIONS
- quarantine the known product defect with test.fixme()
- keep the header selector issue documented separately from the cart-state issue
```

## Authentication Strategy

A dedicated setup project logs in once and saves browser state to `auth/user.json`. Selected authenticated tests reuse that stored session instead of logging in every time.

## Test Data Cleanup Strategy

The framework uses two data-lifecycle patterns:

- resources with a public delete API, such as carts, are cleaned up in-test and should be wrapped in `try/finally` when the test creates them
- resources without a delete API in the public demo app, such as registered users, are isolated with timestamped identities under the `toolshop-qa.dev` test domain

Why this approach:

- it keeps repeat runs deterministic
- it avoids polluting the demo app with reusable shared entities
- it makes leftover data clearly attributable to automation rather than production-like user flows

## Public Vs Auth Smoke

- `npm run test:smoke`
  - broad smoke label execution
  - includes tests tagged `@smoke` across API, UI, and integration areas
  - may include auth-dependent coverage depending on project/tag selection
  - useful for local development, but not the canonical public portfolio command

- `npm run test:public-smoke`
  - credential-free portfolio path
  - runs API + unauthenticated Chromium smoke
  - excludes tests tagged `@auth`
  - this is the canonical public smoke command

- `npm run test:auth-smoke`
  - requires `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
  - runs tests tagged with both `@smoke` and `@auth`
  - excludes auth-only regression coverage that is not part of smoke
  - currently includes:
    - private auth API smoke in the `api` project
    - any browser smoke tests in the `chromium` project that also carry `@auth`
    - authenticated storage-state smoke in the `chromium-auth` project

### How Tags And Projects Work

- `@smoke` is a coverage label, not by itself the exact public runnable suite
- the actual executed set is the combination of:
  - tags such as `@smoke` and `@auth`
  - Playwright projects such as `api`, `chromium`, and `chromium-auth`
- authenticated smoke is intentionally separated:
  - auth-required tests are tagged `@auth`
  - the `chromium` project excludes authenticated UI smoke
  - authenticated UI smoke runs through `chromium-auth` with stored login state
  - other auth-tagged browser tests still run in `chromium` when `@auth` is selected

The GitHub Actions workflow is split the same way:

- `public-smoke` always runs for portfolio visibility
- `auth-smoke` runs only when auth credentials are configured in repository secrets

## Architecture Decisions

### Fixtures And Page Objects

- `fixtures/baseTest.ts` centralizes shared page objects, components, and API clients so tests stay focused on behavior rather than wiring
- `pages/` and `components/` separate reusable UI interactions from assertions in test specs
- API wrappers in `api-clients/` keep request construction and response handling out of the tests

### Project Model

- Playwright projects separate API, public browser, auth setup, and authenticated browser coverage
- `api` isolates service-layer tests from browser behavior
- `chromium` is the public unauthenticated browser path
- `chromium-auth` is reserved for stored-session authenticated coverage

### Tag Strategy

- `@smoke` marks critical-path coverage across API, UI, and integration layers
- `@auth` marks tests that require private credentials or authenticated state
- tags describe business/test intent; projects describe runtime context

### Auth Strategy

- auth setup is performed once and persisted to `auth/user.json`
- public smoke is intentionally credential-free
- authenticated smoke is separated so portfolio reviewers can run meaningful coverage without secrets

### API + UI Strategy

- API tests validate public service contracts directly
- UI tests validate user-facing flows and browser behavior
- integration tests use API as setup/source-of-truth and verify whether the UI reflects the same state
- known product defects are documented instead of silently removed from coverage

### Failure Triage Workflow

- Playwright artifacts are written to `test-results/` with HTML, JUnit, traces, screenshots, and videos
- deterministic helper scripts summarize failures and list tests by tag
- AI-assisted CI triage is optional and runs after deterministic artifacts exist, so LLM output augments evidence instead of replacing it
- repo-local triage guidance can use `playwright-cli` for bounded manual verification when artifacts alone do not separate product issues from test issues

## CI / Reporting

The GitHub Actions workflow:

- installs dependencies
- installs Playwright browsers
- runs smoke coverage
- uploads HTML report
- uploads test results, traces, screenshots, and videos
- optionally generates an AI-assisted triage markdown report on failed CI runs when provider keys are configured
