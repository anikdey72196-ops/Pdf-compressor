## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-11-20 - Avoid Blocking the Event Loop in Route Handlers
**Learning:** Using synchronous file operations (`fs.readFileSync`, `fs.unlinkSync`, etc.) in API route handlers blocks the main Node.js event loop during I/O operations (like reading large files). This spikes latency and prevents other requests from being served concurrently.
**Action:** When implementing route handlers that touch the filesystem in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests. When deleting files via `unlink`, use a `try { await fs.promises.unlink(path); } catch(e) {}` block to safely ignore missing files without crashing.
