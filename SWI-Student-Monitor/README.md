# SWI Student Monitor

**Structured Workflow Intelligence (SWI)** student-monitoring prototype. This repository is a student-facing build and monitoring project, not a production-authorized student-record system.

## Requirements
- Node.js 20+ (Node 22 recommended)
- npm
- Windows users can launch `start.bat`; macOS/Linux can use the commands below.

## Start on Windows
1. Extract the ZIP into a writable folder.
2. Double-click `start.bat`.
3. On first run it installs dependencies from `package-lock.json`, then starts the local development server.
4. Open the URL printed in the terminal (normally `http://localhost:3000`).

## Start manually
```sh
npm ci
npm run dev
```

## Verify
```sh
npm run lint
npm run build
```

## Configuration
Copy `.env.example` to `.env` and fill only the provider credentials you intentionally use. Never commit `.env`, real student data, API keys, OAuth tokens, or production database files. The example environment file contains no credentials.

## SWI boundaries
- This is a prototype, not evidence of legal/regulatory compliance, security certification, or production authorization.
- `PASS` is not `PROVEN`, `SEALED`, or `PRODUCTION AUTHORIZED`.
- Data is not automatically evidence, admission, authorization, or action.
- Student wellbeing signals are not diagnoses or standalone grounds for consequential decisions. Keep a qualified human review process.
- Use synthetic or explicitly authorized test data only until privacy, access control, retention, auditability, incident response, and deployment controls are independently assessed.

## Repository layout
- `src/services/swiCore.ts` and `src/services/swiModuleSecurity.ts`: existing SWI-related application services.
- `docs/audit/`: audit/change notes.
- `start.bat`: Windows startup helper.
- `package.json` + `package-lock.json`: npm manifest and reproducible dependency lock.

## Current status
`IMPLEMENTATION STATUS: PROTOTYPE`  
`TEST STATUS: BLOCKED — DEPENDENCY INSTALLATION INCOMPLETE IN BUILD ENVIRONMENT`  
`SEALED: NO`  
`PRODUCTION AUTHORIZED: NO`

## Copyright and license

Copyright (c) 2026 Keletso Ronald Mosidila. All rights reserved. See [`LICENSE`](LICENSE). Third-party components remain governed by their own licenses.

## Continuous integration

GitHub Actions is configured in `.github/workflows/ci.yml` to run `npm ci`, `npm run lint`, and `npm run build` for pushes, pull requests, and manual runs. A workflow file is configuration—not proof that a workflow has passed. Check the repository's Actions results before treating a commit as verified.


## Build attempt record — 2026-10-17

A local `npm run lint` attempt was made after dependency installation timed out. It failed because the partial `node_modules` tree was missing numerous type-definition packages (TS2688). This is an environment/install failure until a clean `npm ci` can be completed; it is not recorded as a passing test. The production build was not run after the lint failure. The configured CI pipeline must run from a clean checkout to provide an authoritative result.

## Publish to GitHub

For Windows, review the repository contents and follow [`docs/GITHUB_PUBLISH.md`](docs/GITHUB_PUBLISH.md), then run `publish-to-github.bat`. It targets `Kelronmos/SWI-Student-Monitor` and creates the repository as private by default. It requires Git and GitHub CLI authentication. It does not force-push. Verify the actual GitHub Actions run after publishing.
