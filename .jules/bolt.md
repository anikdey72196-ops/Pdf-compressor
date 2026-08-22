## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2026-08-22 - Async Sequential Processing for Batch File Operations
**Learning:** Refactoring synchronous file operations (`fs.readFileSync`, `fs.unlinkSync`, `fs.statSync`) to asynchronous equivalents (`fs.promises`) in API route handlers is critical to avoid blocking the Node.js event loop and causing application-wide latency. However, when handling batch uploads (like compiling multiple images into a PDF), iterating over the files asynchronously but sequentially (using a `for...of` loop with `await`) rather than concurrently (with `Promise.all()`) prevents large memory consumption spikes and Out-of-Memory (OOM) crashes.
**Action:** When updating endpoints that process arrays of uploaded files, replace sync file methods with `fs.promises` but retain sequential `for...of` execution loops for file loading and processing steps.
