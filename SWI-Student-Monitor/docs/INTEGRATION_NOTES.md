# Integration notes

- Integration base: `samh-swi-student-monitor-fixed.zip` (used because it contains the `app/` root and additional reporting/audit components).
- Cross-checked against `samh-swi-student-monitor (1).zip`; this package keeps the fixed archive's app layout and does not blindly overlay files from the other archive because they share many files and may represent different revisions.
- Removed the bundled `samh_swi.db` from the distributable to avoid shipping potentially sensitive records.
- Replaced AI Studio/provider-facing product metadata with SWI Student Monitor identity. Existing AI-backed feature code and provider integrations are retained as implementation dependencies; this branding change does not mean those components have been independently validated.
- No remote GitHub repository was created or pushed by this local packaging step.
