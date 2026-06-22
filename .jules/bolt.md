## 2024-06-22 - Non-blocking File System Operations
**Learning:** Background tasks (like the periodic sweeper) that use synchronous `fs` methods (e.g., `fs.readdirSync`, `fs.statSync`, `fs.unlinkSync`) can block the Node.js event loop when iterating over many files, causing unpredictable latency spikes for incoming API requests.
**Action:** Always prefer `fs.promises` (or asynchronous equivalents) for background or recurring tasks that read or write multiple files to ensure the server remains responsive.
