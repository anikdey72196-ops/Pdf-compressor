## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-05-18 - [Avoid Event Loop Blocking with Synchronous File Operations]
**Learning:** This Node.js Express backend currently utilizes legacy synchronous file operations (like `fs.readFileSync`, `fs.unlinkSync`, `fs.statSync`) in API route handlers which blocks the main event loop and globally spikes latency for all server connections. However, when batch-processing files like uploaded images, using `Promise.all` can cause a memory spike leading to OOM, so async processing should use a sequential `for...of` loop.
**Action:** When working on API routes, always refactor file operations to use `fs.promises.*` within an `async/await` try-catch block to maintain performance while preserving sequential memory hygiene.
