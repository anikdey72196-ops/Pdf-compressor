## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-05-18 - Event Loop Stalls in Background Sweeper Jobs

**Learning:** Periodic background jobs that use synchronous file operations (like `fs.readdirSync`, `fs.statSync`, `fs.unlinkSync`) can cause silent global latency spikes. Because they are not attached to a specific API request, they quietly block the Node.js event loop every time the interval triggers, stalling all concurrent requests.

**Action:** Always use asynchronous non-blocking operations (`fs.promises`) inside `setInterval` or cron jobs, especially when iterating over files or directories.
