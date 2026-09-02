## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-11-21 - Async Sequential IO for Image Batching
**Learning:** While replacing synchronous operations (`fs.readFileSync`, `fs.unlinkSync`) with async alternatives (`fs.promises.*`) is crucial to avoid blocking the event loop in API endpoints, doing so naively using `Promise.all` for batch image processing causes massive memory spikes resulting in OOM errors. It's critical to process large files sequentially using a standard `for...of` loop with `await` to maintain stable memory usage while retaining a non-blocking event loop.
**Action:** When batch processing multiple large files (like images) on the backend, ensure reading and embedding operations are handled sequentially rather than concurrently, and wrap cleanup tasks in `try/catch` explicitly ignoring `ENOENT` to prevent crash-inducing race conditions.

## 2026-08-29 - Non-blocking File Operations in Image to Word Route
**Learning:** Using synchronous file operations (`fs.readFileSync`, `fs.unlinkSync`) in route handlers (such as Image-to-Word conversions) blocks the single-threaded Node.js event loop during file reads and cleanups, introducing latency for concurrent incoming requests.
**Action:** Replace `fs.readFileSync` and `fs.unlinkSync` with `fs.promises.readFile` and `fs.promises.unlink` processed sequentially within async loops, wrapping unlinks in try/catch blocks ignoring `ENOENT`.
## 2026-09-02 - Non-blocking File Operations in Image Compression Route
**Learning:** Using synchronous file operations (`fs.copyFileSync`, `fs.statSync`, `fs.unlinkSync`) in route handlers (such as Image Compression) blocks the single-threaded Node.js event loop during file copies, stats, and cleanups, introducing latency for concurrent incoming requests.
**Action:** Replace `fs.copyFileSync`, `fs.statSync` and `fs.unlinkSync` with `fs.promises.copyFile`, `fs.promises.stat` and `fs.promises.unlink` processed sequentially, wrapping unlinks in try/catch blocks ignoring `ENOENT` to avoid race conditions.
