## 2024-06-17 - Node.js Event Loop Blocking via Synchronous I/O
**Learning:** Found `fs.readFileSync` used inside a loop for batch processing up to 50 user-uploaded images in the `/api/image-to-pdf` route. This blocked the entire Node.js event loop sequentially, starving other concurrent HTTP requests.
**Action:** Always use asynchronous file system operations (e.g., `fs.promises.readFile`) combined with `Promise.all()` to parallelize file I/O and CPU-intensive operations (like `pdf-lib` embedding), ensuring the event loop remains responsive and overall request throughput is maximized.
