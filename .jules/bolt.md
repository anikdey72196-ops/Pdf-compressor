## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2026-07-21 - Batch File Processing with Async vs Synchronous Ops
**Learning:** During batch processing of multiple uploaded files (like images to PDF/Word), using `fs.readFileSync` and `fs.unlinkSync` blocks the main Node.js event loop proportional to the number of files. Conversely, transitioning to `await fs.promises.readFile()` and `unlink()` keeps the event loop clear. Importantly, continuing to use a sequential `for...of` loop with `await` rather than switching to concurrent processing with `Promise.all()` is necessary to avoid massive memory spikes and OOM errors when dealing with image binaries in Node.
**Action:** Always refactor to use `fs.promises` instead of `fs.*Sync` for file operations, but when handling multiple large files or binaries simultaneously in a loop, avoid `Promise.all` and stick to sequential `await` to maintain low memory overhead.
