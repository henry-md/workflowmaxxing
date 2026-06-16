
Make the agent entry points (with text) and /agent-docs.
The God command:

----------------------------------------------------------------------

mkdir -p \
  .cursor \
  agent-docs \
  agent-docs/architecture \
  agent-docs/bug-fixes \
  agent-docs/regression-tests

touch \
  agent-docs/system.md \
  agent-docs/general-directions.md \
  agent-docs/coding-conventions.md \
  agent-docs/architecture/overview.md

cat <<'EOF' > agent-docs/skills/README.md
# Skills

Each file in this directory defines a reusable task.

Invoke with:
/<file-name-in-kebab-case>

Example:
/write-pr-description

Skills are task-specific instructions that direct the agent to perform a job in a repeatable way.

The user may:
- Create a skill manually
- Ask the agent to create a skill
- Invoke a skill using slash commands

Skill files should be concise. Each `agent-docs/skills/[skill].md` file should briefly outline what the skill is, what it should do, and any important constraints or steps to follow. The filename should be the skill name in kebab-case, matching the slash command.

Examples:
- `agent-docs/skills/write-pr-description.md` → invoked with `/write-pr-description`
- `agent-docs/skills/refactor-auth-flow.md` → invoked with `/refactor-auth-flow`

When a relevant skill exists, the agent should follow it.
EOF

COMMON_TEXT=$(cat <<'EOF'
See canonical documentation:

- ../agent-docs/system.md  
  High-level description of what the system does and the major components involved. Examples of related files: system.md, product-overview.md, service-boundaries.md. Include things like the main url endpoints and main backend endpoints.

- ../agent-docs/architecture/  
  Explains how the codebase is structured and how major systems interact. Use this to understand where new code should live and how components connect. Example files: architecture/overview.md, architecture/database.md, architecture/api.md, architecture/auth.md.

- ../agent-docs/coding-conventions.md  
  Contains required coding rules and constraints (e.g., database migrations, dependency rules, file patterns). Always follow these when writing or modifying code, and especially when using terminal commands (like db migrations) or at a cross-roads in approaches. Example topics: database-migrations.md, dependency-rules.md, filstructure.md.

- ../agent-docs/ui-ux-conventions.md  
  Contains required UI/UX rules and constraints. Always follow these when creating or modifying user interfaces, especially extension surfaces where vertical space efficiency matters.

- ../agent-docs/bug-fixes/  
  Short records of important bugs that occurred that might break again easily if we don't document it. Example files: bug-fixes/oauth-loop.md, bug-fixes/race-condition-cache.md. Documenting what the bug was and what approach was taken to solving it. This is equally for the developer's reference as your own.

- agent-docs/regression-tests/  
  Targeted regression notes for behavior that has broken repeatedly. Before making edits, skim relevant files when your touched area is close enough that the behavior may regress. You do not need to re-test every regression note for unrelated changes or new features. Add or update concise entries when an issue regresses often, describing the functionality to preserve, common failure modes, and focused checks that would catch it.

When modifying code, follow the rules defined in these documents. The /agent-docs folder is for you to keep yourself updated as you work on the project on past context. Be concise so that you can continue to maintain it for a while and not have the files blow up in size.
EOF
)

printf "# Codex Agent Instructions\n\n%s\n\n%s\n" \
"$COMMON_TEXT" \
> AGENTS.md

printf "# Claude Agent Instructions\n\n%s\n\n%s\n" \
"$COMMON_TEXT" \
> CLAUDE.md

printf "# Cursor Agent Instructions\n\n%s\n\n%s\n" \
"$(echo "$COMMON_TEXT" | sed 's|agent-docs/|../agent-docs/|g')" \
> .cursor/agents.md

----------------------------------------------------------------------

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