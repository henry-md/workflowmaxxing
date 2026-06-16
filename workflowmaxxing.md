God command explanation

Entry points for Cursor, Codex, Claude CLI:
Cursor — .cursor/agents.md (worse practice is .cursor/rules.md)
• Cursor project rules / rules files, not some generic agent-doc folder as the primary mechanism
Claude CLI — CLAUDE.md
Codex — AGENTS.md

├── AGENTS.md
├── CLAUDE.md
├── .cursor/
│   └── agents.md
└── agent-docs/
    ├── system.md
    ├── coding-conventions.md
    ├── architecture/
    │   └── overview.md
    └── bug-fixes/

Notes
• Only claude CLI's md is natively included in the system prompt, so it's more reliable at following it's agent doc.
• Reference above God command for best practice agent-docs/ folders.


Further codebase standards

/agent-docs
    system.md
    architecture.md
    conventions.md

/docs
    features/
    architecture/
    decisions/

/memory
    tasks/
    learnings/
    experiments/

/prompts
    codegen.md
    debugging.md
    planning.md



Worktree
git worktree add -b <new-branch-name> ../dev/<folder-name> <base-branch>
ex.
git worktree add -b henry-feat ../dev/henry-feat main
git worktree remove ../dev/henry-feat [from inside main repo]


Things to look into
• Aider, Continue.dev, Windsurf