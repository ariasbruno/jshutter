# Contributing to jshutter


All contributions are welcome: bug reports, improvement proposals, documentation corrections, or direct improvements to the codebase. This document describes the guidelines and workflow for collaborating effectively.

---

## Table of Contents

- [How to Report a Bug](#how-to-report-a-bug)
- [How to Propose an Improvement](#how-to-propose-an-improvement)
- [Submitting Changes (Pull Request)](#submitting-changes-pull-request)
- [Code Conventions & Style](#code-conventions--style)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)

---

## How to Report a Bug

If you found a bug in the capture engine, configuration loading, or report generation, open a GitHub *issue* including the following information:

- **Clear, descriptive title** summarizing the problem.
- **Detailed description** of the incorrect behavior.
- **Your test `jshutter.json` file** (make sure to obfuscate or remove real credentials or secrets).
- **Steps to reproduce**: list the exact commands and conditions that trigger the failure.
- **Expected behavior** vs. **Actual behavior** (including the console stack trace if applicable).
- **Execution environment**: Bun/Node version, browser engine used (Chromium, Firefox, WebKit), and operating system.

> 💡 Before opening an issue, check existing ones in the repository to avoid duplicates.

---

## How to Propose an Improvement

If you have an idea for adding new interaction actions, optimizing reports, or adding CLI flags, open an *issue* with the `feature` label and include:

- **Description** of the proposed functionality.
- **Motivation**: what problem it solves and how it helps the community or workflows.
- **Configuration or command example**: what the JSON or CLI command for the proposed feature would look like.

---

## Submitting Changes (Pull Request)

1. **Fork** the repository to your GitHub account.
2. **Create a descriptive branch** from `master`:
	```bash
	git checkout -b feature/my-new-action
	```
3. **Install project dependencies**:
	```bash
	npm install
	```
4. **Make your changes** strictly following the code conventions.
5. **Verify TypeScript compilation**:
	```bash
	npm run typecheck
	```
6. **Commit with clear, descriptive messages** (in Spanish):
	```
	Implementar acción keyboard en el motor de Playwright
	Corregir interpolación de variables de entorno en loader
	```
7. **Push your branch and open a Pull Request (PR)** targeting the `master` branch of the main repository. CI will automatically run `typecheck` — make sure it passes before requesting review.

---

## Code Conventions & Style

To maintain consistency and quality in the codebase, all contributions must follow these rules:

### 1. Strict Tab Indentation
*   **Mandatory rule**: All TypeScript, JavaScript, and configuration JSON files in the repository **must use tabs** for indentation.
*   **Never use spaces** to indent code lines.

### 2. Strict TypeScript Typing
*   **`any` is prohibited**: Using generic `any` types or loose casts (e.g., `as any`) to bypass the TypeScript compiler is strictly forbidden.
*   Instead, use strict types defined in [src/types.ts](src/types.ts), generic types (`<T>`), or ultimately safe types like `unknown` with the corresponding type guards.

### 3. Playwright Evaluations (`page.evaluate`)
*   When writing code executed in the browser context, ensure the compiler has the `"DOM"` library configured within `"lib"` in `tsconfig.json` to natively use browser types (`window`, `document`, `HTMLElement`, `MutationObserver`) strictly, avoiding casts to `any` (like `(globalThis as any)`).

---

## Project Structure

To navigate the jshutter codebase:

```
├── .agents/             # AI skill customizations and specifications
├── assets/              # Static report templates and local skill files
├── docs/                # Detailed tool manuals (español/ and english/)
├── scripts/             # Development and release support scripts
├── src/
│   ├── actions/         # Individual sequential action implementations
│   ├── commands/        # CLI command handlers (run, validate, init, install-skill)
│   ├── config/          # Loading, viewport/URL resolution, and schema validation
│   ├── engine/          # Concurrency engine and Playwright orchestration
│   ├── reporter/        # HTML Base64 and JSON report generators
│   ├── skills/          # AI skill installer for agents
│   ├── cli.ts           # Command definition entry point (Commander)
│   ├── engine.ts        # Playwright concurrency pool manager
│   ├── types.ts         # Core type definitions and contracts
│   ├── update-checker.ts # NPM update version checker
│   └── version.ts       # Package version reader from package.json
```

---

## System Architecture

For a deep understanding of the engine design, execution flow, module dependencies, and key design decisions, see [ARCHITECTURE.md](./ARCHITECTURE.md).
