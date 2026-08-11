## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.
## 2026-08-11 - Functional testing of CLI wrappers when underlying CLI is absent
**Learning:** In environments lacking required CLI tools (like Ghostscript via `gs`), testing functionality that calls these tools will result in `ENOENT` errors that stop execution.
**Action:** Mock the CLI tool by creating a bash script that accepts the expected arguments and produces an expected side-effect (e.g., copying the input file to the `sOutputFile` path), placing it in the `PATH` or overriding the tool's binary path via environment variables.
