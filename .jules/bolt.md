## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2023-10-25 - Synchronous File Operations Block Event Loop
**Learning:** This codebase historically relied on synchronous `fs` methods (e.g., `fs.existsSync`, `fs.unlinkSync`, `fs.statSync`) in API routes which block the Node.js event loop during heavy I/O operations (like temp directory management or reading output files), severely impacting concurrent performance.
**Action:** Always replace synchronous `fs` calls with their `fs.promises` asynchronous equivalents in route handlers. When replacing combinations like `if (fs.existsSync(path)) fs.unlinkSync(path)`, use a `try/catch` block around `await fs.promises.unlink(path)` and explicitly handle/ignore `ENOENT` to avoid race conditions.

## 2023-10-25 - Prevent UnhandledPromiseRejection in Async Callbacks
**Learning:** When refactoring callback-based asynchronous flows (like `execGhostscript(..., async (err) => {...})`) to use Promises (`fs.promises`), failing to wrap `await` calls in `try/catch` blocks can lead to unhandled promise rejections if the operation fails, crashing modern Node.js servers outright.
**Action:** Always wrap `await` calls within asynchronous callbacks inside `try/catch` blocks, particularly when interacting with the file system, to ensure robust error handling and avoid process crashes.
