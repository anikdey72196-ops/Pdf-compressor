## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.
\n## 2026-08-14 - Avoiding package-lock.json drift during local testing\n**Learning:** Running `npm install` to fix missing dependencies during local test execution can unintentionally modify `package-lock.json` and `node_modules` state, polluting the git history and review environment.\n**Action:** Always check `git status` after installing dependencies for local tests. Use `git restore --staged` and `git checkout` to discard unwanted modifications to lock files before submitting.
