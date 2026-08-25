## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2026-08-25 - Replaced Sync fs Methods in Image Batching Routes
**Learning:** The endpoints `imgToPdf.js` and `imgToWord.js` heavily utilized synchronous file I/O (`readFileSync`, `unlinkSync`, `statSync`) while processing batches of images inside a loop, causing significant event loop blocking.
**Action:** Use `fs.promises.readFile`, `fs.promises.unlink`, and `fs.promises.stat` within `try/catch` blocks inside the loop. This maintains sequential processing to prevent OOM errors while preventing the event loop from being blocked by synchronous methods.
