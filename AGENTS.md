# AGENTS.md

## Git rules

- Keep commits atomic: commit only the files you touched and list each path explicitly. For tracked files run `git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. For brand-new files, use `git restore --staged :/ && git add "path/to/file1" "path/to/file2" && git commit -m "<scoped message>" -- path/to/file1 path/to/file2`.
- Always double-check `git status` before any commit.
- ABSOLUTELY NEVER run destructive git operations such as `git reset --hard`, `rm`, or `git checkout` / `git restore` to an older commit unless the user gives an explicit, written instruction in this conversation. Treat these commands as catastrophic; if there is any uncertainty, stop and ask before using them.
- Never amend commits unless there is explicit written approval in this task thread.
- Delete unused or obsolete files when changes make them irrelevant, such as during refactors or feature removals.
- Revert files only when the change is yours or the user explicitly requested the revert.
- Moving, renaming, and restoring files is allowed.
