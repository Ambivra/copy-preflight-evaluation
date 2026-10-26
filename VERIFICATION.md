# Local verification of this evaluation

Checked on 2026-10-25 with synthetic data. No real customer data or database was used.

- Node test runner: 12 passed, zero failed.
- Actual VS Code 1.89.1 Extension Development Host: registered command,
  diagnostic positions, invalid/valid samples, clearing stale diagnostics after CSV
  and profile edits, unsupported profile/read failures, and invalid UTF-8 rejection.
  The real command was called with local URI arguments; file-picker gestures were
  not automated. The checker reads the CSV editor buffer and the saved profile.
- PostgreSQL 16.13: 51 supported cases agreed, zero mismatches;
  9 other cases stopped as incomplete. NULL/FORCE settings,
  decimal int4/int8 boundaries and selected CSV failure modes were covered.
- Free comparison tools: CSVLinter 1.10.1 and Frictionless 5.21.0. The tested
  missing-value settings either accepted both an unquoted empty field and quoted
  empty string, or rejected both; COPY text NOT NULL rejected only the unquoted
  NULL. This is a narrow configuration comparison, not proof of paid demand.

The executable files in the evaluation VSIX match the tested runtime bytes. The
evaluation README/license and distribution metadata are prepared separately.
Only Windows with the stated VS Code version was validated. There is no claim of
successful production import, every PostgreSQL version, customer adoption, paid
conversion, continuous availability, or unattended customer support.

## Runtime SHA-256

- core.cjs: 83b7f4d90ecbc39160a482cd60b83c8e8733505c483636a16ed90e58eb53fdfe
- extension.cjs: 5cfefa429ec5f4d41f83ed1b87a2bebc279aff8ee5f372c0bc386d69f2f6f27a
- io.cjs: efc5ad121ff758afeb3f8bba7f28e79d20dd4c9fc409dff7be3d563d6d2b7732
- cli.cjs: c8c367345f907e9b0b76a30768ce559e2cc025c241bbaac8b10f598344889de3
