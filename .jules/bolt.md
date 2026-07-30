## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-11-20 - Avoid Event Loop Blocking in Batch Image Uploads
**Learning:** Batch processing endpoints, such as `imgToPdf.js` handling arrays of up to 20 uploaded images, are particularly vulnerable to blocking the main Node.js event loop when using synchronous file methods (`fs.readFileSync`, `fs.unlinkSync`, `fs.statSync`). Processing many files sequentially with synchronous operations can cause brief but impactful latency spikes for all concurrent API requests across the server.
**Action:** Always prefer asynchronous file access via `fs.promises` for file I/O operations inside request handlers, particularly when iterating over file arrays. Use sequential asynchronous `await fs.promises.readFile()` instead of `Promise.all()` on large files to prevent severe memory spikes (OOM errors) while preserving main thread responsiveness.
