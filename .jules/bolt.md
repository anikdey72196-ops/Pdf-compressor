## 2026-06-14 - Parallel Image Processing
**Learning:** The `/api/image-to-pdf` endpoint had a severe performance bottleneck due to synchronous `fs.readFileSync()` calls inside a loop. This blocked the Node.js event loop completely, degrading throughput for all users during compilation.
**Action:** Replaced sequential synchronous I/O with concurrent asynchronous operations (`fs.promises.readFile` combined with `Promise.all`). Always review `for` loops that contain file I/O or network requests in Node.js applications to ensure they do not unnecessarily block the main thread.
