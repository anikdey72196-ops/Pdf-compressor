## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2023-10-27 - Synchronous sweeps blocking the event loop
**Learning:** Found a critical anti-pattern in the server's periodic cleanup job where `fs.readdirSync`, `fs.statSync`, and `fs.unlinkSync` were used inside a `setInterval`. Even if it's just maintenance, using synchronous I/O periodically completely stalls the Node event loop, causing unpredictable latency spikes for all concurrent API requests during that tick.
**Action:** Always prefer `fs.promises` (e.g., `fs.promises.readdir`, `fs.promises.unlink`) for any file operations inside background jobs, even if the files seem small, to ensure main thread availability.
