## 2026-06-29 - Asynchronous sequential file reading for large batches

**Learning:** When batch processing multiple large files, avoiding synchronous operations like `fs.readFileSync` is crucial to prevent blocking the Node.js event loop. However, replacing it directly with `Promise.all()` and `fs.promises.readFile()` concurrently can cause severe memory spikes and Out of Memory (OOM) errors.
**Action:** Always process large batches sequentially using a `for...of` loop with `await fs.promises.readFile()` to balance event loop responsiveness and memory consumption.
