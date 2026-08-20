## 2026-08-20 - [Avoid truncation in read_file]
**Learning:** When using the `read_file` tool, the output may be truncated (e.g., to 1000 characters). This can cause issues with Groundedness Rules during plan review.
**Action:** To completely verify a file's contents or satisfy plan review Groundedness Rules, use `run_in_bash_session` with commands like `cat`, `grep`, `head`, or `tail`.
