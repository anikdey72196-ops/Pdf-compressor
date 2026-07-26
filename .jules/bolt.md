## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-11-21 - Avoiding OOM Spikes in Batch Processing
**Learning:** While replacing synchronous file system operations (like `fs.readFileSync`) with asynchronous ones is standard practice to prevent blocking the event loop, replacing a sequential loop with `Promise.all()` for batch processing large files (like images) can lead to severe memory spikes and Out of Memory (OOM) errors in this app's architecture. Processing files concurrently loads all file data into memory simultaneously.
**Action:** Always process large batch uploads sequentially using `for...of` loops with `await fs.promises.readFile()` instead of using `Promise.all()`. This prevents overwhelming the system's memory limits while still avoiding event loop blocking.
