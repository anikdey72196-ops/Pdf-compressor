## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-05-15 - Async File I/O in Unbounded Maintenance Tasks
**Learning:** Using synchronous file system operations (`fs.readdirSync`, `fs.unlinkSync`, etc.) inside a `setInterval` cleanup job is highly dangerous. While it seems fine with a few files, if the server encounters high load and creates thousands of temporary files, the cleanup job will completely block the Node.js event loop while iterating over and deleting them. This stalls all incoming and outgoing API requests, causing severe latency spikes.
**Action:** Always use asynchronous file operations (`fs.promises`) for background maintenance tasks that process an unbounded or unknown number of files, keeping the event loop free to handle concurrent requests.
