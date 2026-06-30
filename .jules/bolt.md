## 2024-05-24 - Async Sequential File Processing
**Learning:** In Node.js, using synchronous file operations (like `fs.readFileSync`) during batch processing blocks the event loop and degrades performance. However, processing multiple large files concurrently with `Promise.all` can cause memory spikes and OOM errors.
**Action:** When batch processing multiple large files, use asynchronous sequential loops (e.g., `for...of` with `await fs.promises.readFile`) to unblock the main thread while maintaining memory safety.
