## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2026-07-24 - Avoid Synchronous File Operations in Background Tasks

**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.unlinkSync`, etc.) inside a periodic background task (like `setInterval`) blocks the Node.js event loop completely while it runs. This causes severe latency spikes globally, delaying all incoming API requests during the execution window.

**Action:** Always use async file operations (`fs.promises`) inside `setInterval` or cron jobs to ensure the event loop remains responsive and does not block concurrent connections, especially when sweeping directories potentially holding hundreds of files.
