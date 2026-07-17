## 2024-05-24 - Async vs Concurrent Batch File Processing
**Learning:** While `fs.promises` should be used instead of synchronous `fs` methods (`readFileSync`, etc.) to prevent blocking the Node.js event loop, when processing a batch of large files (like images in the `/api/image-to-pdf` route), `Promise.all()` can cause severe memory spikes leading to Out of Memory (OOM) errors.
**Action:** When batch processing multiple large files in this codebase, process them sequentially with `await fs.promises.readFile()` in a `for...of` loop rather than concurrently with `Promise.all()`.
