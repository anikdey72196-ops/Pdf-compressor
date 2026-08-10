## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-11-20 - Ensure Environment State Pre-Testing
**Learning:** Test scripts/deployments might be using missing dependencies which are not explicitly failing the CI build due to poor project setups but which actually cause local development servers to crash immediately. We encountered issues where missing `docx` and `sharp` blocked startup.
**Action:** Run `npm install` gracefully if standard modules throw a `MODULE_NOT_FOUND` error to make sure that package definitions resolve before starting local server, and also avoid committing auto-generated changes like `package-lock.json` unless it was directly required by the optimization.
