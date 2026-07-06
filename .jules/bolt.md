## 2024-11-28 - Avoid Promise.all for Batch Image Processing
**Learning:** In a Node.js API endpoint that parses and reads multiple large files (like images) to compile them into a PDF, using `Promise.all` for concurrent asynchronous file processing can lead to huge memory spikes and out-of-memory (OOM) errors, taking down the server.
**Action:** Always process large files sequentially using a standard `for...of` loop with `await` (e.g. `await fs.promises.readFile`) in scenarios involving potentially large memory footprints, keeping the event loop unblocked while preventing memory exhaustion.
