## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2026-07-20 - Async background tasks in Node.js
**Learning:** Synchronous file system operations (`fs.readdirSync`, `fs.statSync`, `fs.unlinkSync`) in periodic background tasks like `setInterval` block the Node.js event loop, causing unexpected latency spikes and stalling active API requests when processing many files.
**Action:** Use asynchronous `fs.promises` methods for I/O bound background tasks to prevent blocking the event loop and ensure smooth handling of concurrent requests.
