# CopyPreflight by Ambivra — a small CSV COPY check inside VS Code

**Evaluation build. Not for sale.** CopyPreflight checks a deliberately small subset of PostgreSQL CSV COPY input rules before you connect to a database. It is intended for developers who repeatedly receive CSV exports and need to locate certain NULL and integer problems in their editor.

Your selected CSV and profile stay local. The extension does not import data, connect to a database, call an AI service, or rewrite your file.

## Install and try

This evaluation was tested on **Windows, VS Code 1.89.1**. Other OS and editor versions have not been validated. The VSIX is a direct evaluation download; it is not a verified Marketplace listing. Its identifier is `ambivra-unpublished.copy-preflight-local`. The publisher identifier is package metadata and does not imply a registered Marketplace publisher.

1. Download `copy-preflight-evaluation-0.1.0.vsix` from this repository's evaluation release.
2. In VS Code, open Extensions, choose the `...` menu, then **Install from VSIX…** and select the downloaded file. Read the evaluation permission first.
3. Download the three files under `samples/` into a local folder. Open the Command Palette and run **CopyPreflight: Check Selected CSV with Profile**. Select `fail.csv`, then `default.profile.json`.
4. The Problems panel should show five diagnostics. Repeat with `pass.csv` to get zero diagnostics. The check reads the current CSV editor buffer and the **saved** profile file. Save profile changes and run the command again.

The `docs/` directory contains the browser-demo source and synthetic samples. A hosted demo is not included in this snapshot. Use the VSIX installation and sample steps above for the supported evaluation workflow. File selectors in the demo read locally. Use synthetic data when sharing a screenshot or support issue.

Use **CopyPreflight: Clear Diagnostics** to clear the result. To stop using the extension, uninstall **CopyPreflight (local evaluation)** from Extensions. Your CSV and profile are not changed by the checker.

## What this evaluation is testing

PostgreSQL can distinguish an unquoted empty CSV field from a quoted empty string. A generic missing-value rule can treat those two cases alike. This prototype keeps that distinction and checks a few explicit input types against a saved profile.

This is a narrow workflow experiment. Free tools such as CSVLinter and Frictionless already offer substantial CSV/schema validation. We are testing whether COPY-specific checks in a recurring VS Code workflow add enough value to justify a product. We have not established that customers want to pay for it.

## Scope and limits

Use synthetic files first. Consult the included product README for the exact tested formats, options, limits, and installation commands. Unsupported rules must not be treated as a successful check. A clean result is not a guarantee that a database import will succeed: database state, constraints, permissions, triggers, other data types, and unsupported options are outside this evaluation.

Supported here: strict UTF-8 without BOM, comma CSV, double quotes with doubled-quote escape, consistent LF/CRLF/CR record endings, quoted embedded newlines, a boolean header flag, `text`/`int4`/`int8`, NOT NULL, a saved NULL token, FORCE_NULL and FORCE_NOT_NULL. This is not SQL/DDL inference or HEADER MATCH. Nondecimal integer forms, mixed record endings, remote/virtual workspaces and UNC paths are outside scope. Select locally stored files; mapped network drives are not independently classified.

Limits: CSV 5 MiB, profile 64 KiB, 128 columns, 65,536 UTF-16 units per field, 50,000 records including the header, 100,000 physical lines, 200 diagnostics. Exceeding a limit, unsupported conditions, malformed quoting or invalid UTF-8 gives an **incomplete** result. Diagnostics contain positions/codes, not raw cell values or file paths. Once quoting becomes ambiguous, later records are not certified.

## Price research

There is no checkout, card collection, subscription, or automatic charge. We are considering **USD9/month, before tax**, for a future supported product that makes this recurring job easier. That product is not available to order. An expression of interest creates no purchase or payment obligation.

If you already repeat this job, the feedback template asks whether you completed a useful check, reused it, and would choose the proposed price over your current alternative. Please describe the workflow using synthetic data; do not share production CSVs, private schema names, credentials, or personal information.

## Support and privacy

Use this repository's issue template for evaluation feedback. Public issues, your GitHub username, and what you post are visible to others. AI assists with triage, diagnosis, and replies. The extension sends no telemetry or support message on your behalf. Support during the evaluation is best effort; this is not a production availability commitment.

Prepared with AI assistance and local synthetic checks. The verification note lists what was actually tested. No customer counts, savings, purchase conversions, or revenue are claimed.
