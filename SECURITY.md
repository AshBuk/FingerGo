# Security Policy

## Supported Versions

Only the latest released version of FingerGo receives security fixes.

## Reporting a Vulnerability

Please report security issues privately via GitHub's [**Report a vulnerability**](https://github.com/AshBuk/FingerGo/security/advisories/new) form (Security tab → Advisories) rather than opening a public issue. If GitHub is not an option for you, you can email **asherbuk@gmail.com** instead.

Include, if possible:

- A description of the issue and its impact
- Steps to reproduce (or a proof of concept)
- The affected version and platform (Linux / macOS / Windows)

You can expect an initial response within **7 days**. Once the issue is confirmed, a fix will be prepared and released as soon as reasonably possible, and you will be credited in the release notes unless you prefer to stay anonymous.

## Scope

FingerGo is an offline desktop application: it stores texts, statistics, and configuration as local JSON files and does not make network requests or handle third-party accounts. Reports most relevant to this project include:

- Path traversal or arbitrary file read/write via text imports or configuration
- Code execution via crafted text content rendered in the webview
- Issues in the Wails bridge between the Go backend and the JavaScript frontend

Out of scope: vulnerabilities in upstream dependencies (please report those to the respective projects) and issues that require prior local root/admin access.
