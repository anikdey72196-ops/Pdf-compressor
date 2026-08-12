## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-05-18 - Replacing Blocking Synchronous I/O in Express Routes
**Learning:** Legacy Express routes using synchronous file operations (like `fs.existsSync`, `fs.unlinkSync`, and `fs.statSync`) block the entire Node.js event loop. This leads to latency spikes and stalls concurrent requests during heavy file operations.
**Action:** Always use non-blocking asynchronous file operations (like `fs.promises.unlink`, `fs.promises.stat`, `fs.promises.access`). When replacing synchronous deletion patterns, explicitly wrap the async unlink in a try/catch block and ignore `ENOENT` errors to safely handle files that may already be missing without crashing or stalling the event loop.
