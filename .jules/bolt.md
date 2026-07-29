## 2024-11-20 - Avoid Blocking the Event Loop with Sync Operations in Batch Upload Endpoints
**Learning:** Processing a batch of large files (like images) using synchronous file operations (`fs.readFileSync`, `fs.unlinkSync`) blocks the Node.js event loop completely until the request completes. This acts as a system-wide bottleneck, making the app unresponsive to other concurrent requests during the compilation process. However, parallelizing these reads using `Promise.all` causes memory spikes (OOM errors) for large image batches.
**Action:** When handling endpoints with batch file operations (like `/api/img-to-pdf`), use async file operations (e.g., `await fs.promises.readFile`) executed sequentially in a `for...of` loop. This releases the main thread back to the event loop between operations, maintaining responsiveness while keeping memory footprints manageable. Use `try/catch` wrapping `await fs.promises.unlink` when deleting temporary files.

## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.
