## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-05-18 - Avoid synchronous file operations during batch uploads
**Learning:** Using synchronous file operations (`fs.readFileSync`, `fs.unlinkSync`, `fs.statSync`) when processing arrays of uploaded files (e.g., in endpoints accepting up to 20 images) completely blocks the Node.js event loop. This leads to severe latency for all other concurrent requests. However, processing files with `await fs.promises.readFile()` sequentially (e.g., `for...of` loop) is preferred over loading them concurrently (`Promise.all()`) to avoid massive memory spikes and potential Out Of Memory (OOM) errors.
**Action:** When handling batch uploads, replace all synchronous file operations with their async counterparts from `fs.promises`. Use sequential asynchronous processing (`for...of`) rather than concurrent mapping when dealing with large files to balance event loop concurrency and memory usage.
