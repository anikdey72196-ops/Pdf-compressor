## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.
## 2024-08-06 - Image Batch Processing Memory Optimization
**Learning:** When refactoring synchronous `fs.readFileSync` loops to use asynchronous `fs.promises.readFile` for image batch processing, reading all large files concurrently with `Promise.all` can cause massive memory spikes and Out of Memory (OOM) errors in Node.js.
**Action:** When iterating over user-uploaded files for operations like PDF embedding, keep the `await fs.promises.readFile()` calls sequential inside a standard `for...of` loop to balance non-blocking I/O with memory safety.
