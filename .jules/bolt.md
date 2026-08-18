## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.
## 2026-08-18 - Replacing fs.unlinkSync and Batch Async vs Sync
**Learning:** Using synchronous file operations (`fs.readFileSync`, `fs.unlinkSync`) for batch processing large sets of files (like images for PDF/Word generation) blocks the Node.js event loop, increasing latency for other requests. However, switching to a purely concurrent approach (e.g., `Promise.all`) for file reading can cause severe memory spikes (OOM).
**Action:** Replace synchronous operations with `fs.promises` but process batch items sequentially in a `for...of` loop. Also, replace `if (fs.existsSync(path)) fs.unlinkSync(path)` with `try { await fs.promises.unlink(path); } catch (e) { if (e.code !== 'ENOENT') throw e; }` to handle race conditions safely.
