# Third-party tools and product boundaries

The evaluation VSIX and browser demo contain independently implemented JavaScript
with no bundled npm/Python packages, external binaries, fonts, analytics, or AI SDKs.

The comparison used CSVLinter 1.10.1 (MIT) and Frictionless 5.21.0 (MIT) against
synthetic files. Their code and dependencies are not redistributed in this build.
Only the tested configurations are compared; this is not a claim that all free
tool modes lack the behavior or that either project is defective.

- CSVLinter: https://github.com/csvlinter/csvlinter/releases/tag/v1.10.1
- Frictionless: https://pypi.org/project/frictionless/5.21.0/
- COPY reference: https://www.postgresql.org/docs/16/sql-copy.html

VS Code, Node.js, Python, Docker and PostgreSQL were separate test/development
tools and are not bundled. PostgreSQL oracle checks used 16.13; they do not prove
compatibility with every database version, option or data type. Microsoft and
PostgreSQL are not represented as sponsors or endorsers of this evaluation.
