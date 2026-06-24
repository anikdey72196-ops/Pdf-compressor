## 2024-06-24 - Async I/O in Loop Blocking Event Loop
**Learning:** Found synchronous `fs.readFileSync` inside a loop when embedding images in `server.js` (`/api/image-to-pdf`). Even if image embedding itself is fast, reading files synchronously block the Node.js event loop, limiting the server's concurrency when processing large PDFs from many images.
**Action:** Always prefer `fs.promises.readFile` combined with `Promise.all()` to parallelize I/O for batch operations (like reading multiple uploaded files), allowing Node.js to serve other requests concurrently.
