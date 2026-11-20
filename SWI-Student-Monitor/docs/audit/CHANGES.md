# Change record

## 2026-10-17 — repository packaging and CI preparation

- Added project copyright notice and proprietary-use terms for original project materials.
- Declared Node.js/npm engine requirements.
- Aligned root package metadata in `package-lock.json` without intentionally changing dependency resolutions.
- Added GitHub Actions CI for locked dependency installation, TypeScript checking, and production build.
- Made the clean script cross-platform.
- No claim of a passing CI run is made until GitHub Actions or an equivalent local run completes successfully.
