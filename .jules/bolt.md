## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2026-08-27 - Asynchronous Cleanups for Batched Operations
**Learning:** The cleanup logic in file processing routes originally used a synchronous `req.files.forEach` catch block with `fs.unlinkSync`. This introduces significant event loop blocking during failure conditions, exacerbated by `forEach` preventing straightforward usage of async/await. Additionally, performing sequential operations rather than concurrent ones via `Promise.all()` during file cleanup/uploads helps avoid Memory Spikes and OOM errors in this architecture.
**Action:** When updating file cleanup handling, always switch block iterators to `for...of` loops running asynchronous `try/catch` blocks that ignore `ENOENT` to safely scale processing without blocking the event loop or spiking memory.
