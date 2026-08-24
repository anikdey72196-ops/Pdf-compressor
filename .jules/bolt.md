## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2026-08-24 - [Avoid `Promise.all()` for batch file processing in Express]
**Learning:** [When refactoring synchronous file operations (`fs.readFileSync`) to asynchronous (`fs.promises.readFile`) for batch processing endpoints (like image compilation), use sequential `for...of` loops rather than parallel `Promise.all()`. `Promise.all()` with multiple large file uploads causes severe memory spikes and Out of Memory (OOM) errors in this specific Node.js environment.]
**Action:** [Always use sequential processing (`for...of`) when iterating over `req.files` and reading their contents asynchronously to maintain predictable memory usage, while still preventing event loop blocking.]
