## 2026-07-20 - Fix Duplicate Logic Causing Syntax Error

**Learning:** Duplicate lines in code when refactoring block scope and missing to delete original block cause syntax and unexpected token errors (like `Unexpected token 'catch'`).

**Action:** Always verify code after copy/pasting. `node --check` should be used extensively when no `eslint` or tests are present before pushing any changes.

## 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks
**Learning:** Using synchronous file operations (`fs.readdirSync`, `fs.statSync`, etc.) in a periodic `setInterval` task blocks the main Node.js event loop. This leads to latency spikes for all users every time the sweeper runs, which becomes worse as the number of files scales up.
**Action:** When implementing background cleanup or maintenance tasks in Node.js, always use asynchronous alternatives (`fs.promises`) to keep the main thread unblocked for handling API requests.

## 2024-05-18 - Avoid committing local dependencies cache changes during testing
**Learning:** During testing, running `npm install` inside the backend directory caused updates to `package-lock.json` and the `node_modules` directory, which were then accidentally staged for commit. This pollutes the git history and can break the remote test environments.
**Action:** When running `npm install` locally to fix missing dependencies in test scripts, ensure any changes to `package-lock.json` and `node_modules` are discarded and not staged in the PR using `git checkout` or `git reset` commands.
