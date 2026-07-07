## 2024-05-24 - Async Sequential File Reading
**Learning:** When batch processing multiple large files (like images), replacing `fs.readFileSync` with `await fs.promises.readFile` inside sequential loops prevents blocking the main thread while avoiding the memory spikes that would occur with `Promise.all`.
**Action:** Use sequential async iterators for reading large arrays of files instead of sync methods or parallel promise execution.
