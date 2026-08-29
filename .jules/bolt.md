## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-11-21 - Async Sequential IO for Image Batching
**Learning:** While replacing synchronous operations (`fs.readFileSync`, `fs.unlinkSync`) with async alternatives (`fs.promises.*`) is crucial to avoid blocking the event loop in API endpoints, doing so naively using `Promise.all` for batch image processing causes massive memory spikes resulting in OOM errors. It's critical to process large files sequentially using a standard `for...of` loop with `await` to maintain stable memory usage while retaining a non-blocking event loop.
**Action:** When batch processing multiple large files (like images) on the backend, ensure reading and embedding operations are handled sequentially rather than concurrently, and wrap cleanup tasks in `try/catch` explicitly ignoring `ENOENT` to prevent crash-inducing race conditions.
