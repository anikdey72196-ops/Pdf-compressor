## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2026-08-01 - Avoid Blocking Event Loop in Route Handlers
**Learning:** Route handlers performing batch file processing (e.g. converting multiple images to PDF) using synchronous functions like `fs.readFileSync` or `fs.unlinkSync` block the event loop entirely, destroying concurrency. Refactoring to async logic significantly improves latency.
**Action:** When handling arrays of files in routes, use `fs.promises` sequential async reads/unlinks to ensure high throughput while preventing OOM crashes.
