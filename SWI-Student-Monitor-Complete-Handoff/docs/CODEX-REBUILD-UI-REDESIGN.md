# SWI Student Monitor — Codex Rebuild and UI Modernisation Specification

## Objective
Use the latest Student Monitor project archive and supplied screenshots to improve the app's visual design while preserving existing working features, SWI control boundaries, privacy requirements, and reproducible verification.

## Start with repository inspection
1. Inspect the repository structure, package manifests and lockfile, README, app entry points, API services, database code, routes, tests, platform configuration, and SWI documentation.
2. Inspect all supplied screenshots and map visible screens to their source components.
3. Record current Git branch, working tree, baseline commit, and test results.
4. Identify actual features versus decorative or incomplete UI controls. Do not overwrite unrelated work.

## UI design requirements
- Use a cohesive, modern, professional SWI Student Monitor visual identity.
- Remove unrelated AI-builder/template branding from the product interface.
- Create consistent typography, spacing, icons, colors, cards, navigation, and responsive layouts.
- Redesign the dashboard, student views, monitoring screens, reports, device-capabilities panel, and settings where those screens exist.
- Provide useful loading, empty, error, offline, permission-denied, and success states.
- Ensure keyboard accessibility, readable contrast, visible focus, and touch-friendly mobile controls.
- Make every button, link, menu, and form work. Do not add decorative controls that imply unsupported functionality.
- Use synthetic student data in demos and test fixtures; never expose real student information in screenshots or logs.

## Preserve SWI boundaries
DATA ≠ EVIDENCE ≠ ADMISSION ≠ AUTHORIZATION ≠ ACTION
OBSERVATION ≠ AUTHORITY
UNKNOWN ≠ FALSE ≠ PERMITTED
STABLE ≠ AUTHORIZED
SIGNATURE ≠ TRUTH ≠ AUTHORITY
TESTED ≠ PROVEN ≠ SEALED ≠ PRODUCTION AUTHORIZED
PASS ≠ PROVEN ≠ AUTHORIZED
HASH ≠ AUTHORITY ≠ TRUTH

A green indicator, successful test, signature, or hash must not independently grant authority. Keep approval, pass, deny, halt, and advice distinct. Do not weaken execution-integrity controls to simplify the UI. Never present a state the underlying system has not established.

## Privacy and sensors
- Request device permissions only after explicit user action and explain why.
- Handle permission denial gracefully.
- Do not collect location, camera, microphone, motion, or other sensor data automatically just because the app opens.
- Stop camera streams and remove sensor listeners when a feature closes.
- Do not transmit or persist sensor data unless a documented, authorised workflow requires it.
- Do not claim legal or regulatory compliance without evidence.

## Cross-platform architecture
Targets: Android, iOS, Windows, macOS, Linux, and supported mobile/desktop browsers.

Inspect the existing Express + SQLite backend and resolve the mobile API boundary explicitly. A Capacitor WebView does not automatically run the Express/SQLite backend locally. Choose and document either a secured HTTPS backend with an explicit API base URL and appropriate authentication/network controls, or a supported native/local persistence architecture with a deliberate sync strategy. Do not merely change relative API URLs and declare mobile support complete.

If offline operation is required, implement and test supported local persistence, safe write queuing, retry behavior, duplicate protection, conflict handling, revalidation before consequential operations, and clear sync states. A queued write is not a synchronized write; cached data is not necessarily current.

## Controlled implementation stages
A. Inspect and establish baseline.
B. Document existing features and failures.
C. Implement shared design tokens and reusable components.
D. Redesign navigation and dashboard.
E. Redesign remaining screens from screenshots.
F. Repair broken workflows and API integration.
G. Repair platform-specific behavior.
H. Implement/test offline workflows where required.
I. Run tests, type-check, builds, and SWI boundary checks.
J. Produce a reproducible verification report.

After each stage, report changed files, checks run, actual results, and remaining gaps. Do not claim completion merely because code was written.

## Verification requirements
- Run existing tests before and after changes.
- Run full TypeScript type-check and production web build.
- Run Android native build when Android SDK/JDK are available.
- Run iOS Simulator build on macOS with Xcode.
- Build desktop installers on supported runners.
- Test key flows with browser automation or equivalent.
- Test offline behavior end-to-end; a web build alone does not prove offline correctness.
- Do not claim physical-device sensor tests unless real devices were used.
- Do not suppress TypeScript errors or weaken tests to get green results.

Report each check as PASS, FAIL, BLOCKED, NOT RUN, or NOT VERIFIED. Include commands, actual counts/results, screenshots, remaining defects, reproduction steps, and commit identifier if a commit was made.

## Change control
Work only in the Student Monitor project. Do not modify frozen SWI core repositories, rewrite Git history, force-push, publish secrets, or release without explicit authorisation.

## Acceptance objective
Deliver a materially improved UI without sacrificing working features, privacy, SWI control boundaries, evidence integrity, or honest verification. Proof before power.
