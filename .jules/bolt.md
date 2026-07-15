## 2024-07-15 - Node Event Loop vs Out Of Memory

**Learning:** When batch processing multiple large files (e.g., images) on the backend, using asynchronous `fs.promises.readFile` avoids blocking the Node event loop (unlike `fs.readFileSync`). However, reading them all concurrently via `Promise.all()` can cause severe memory spikes and Out of Memory (OOM) errors.

**Action:** Process large files asynchronously but sequentially in a `for...of` loop to balance event loop responsiveness with memory safety.