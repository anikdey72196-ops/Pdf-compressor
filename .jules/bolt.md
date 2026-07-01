## 2024-05-24 - Async Batch Processing Memory Spikes
**Learning:** When batch processing multiple large files (like images in `/api/image-to-pdf`), replacing synchronous reads (`fs.readFileSync`) with fully concurrent asynchronous reads (like `Promise.all(files.map(f => fs.promises.readFile(f)))`) causes severe memory spikes and Out of Memory (OOM) errors in this Express app architecture.
**Action:** Always process large file arrays sequentially with a `for...of` loop and `await fs.promises.readFile()` to balance event loop non-blocking with manageable memory usage.
