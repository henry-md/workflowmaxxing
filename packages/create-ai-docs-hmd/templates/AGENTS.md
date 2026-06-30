# Agent Instructions

As an agent, use `agent-docs/` as your durable project memory. These are living, breathing docs, so you should update them as you go to document important things. Be respectful to future agents and do not bloat the docs.

**The following files should always be in your working memeory. Especially for some of the longer files, it's ok not to have the entire document in working memory, but you should at least understand the general area it touches, so that if you're working on adjacent functionality you can pull on that thread and give yourself the relevant context**

Files (all of these should be fully in your working memory):

- `agent-docs/agent-operating-contract.md`: Required workflow rules, command constraints, git/deploy boundaries, runtime cleanup, and migration safety.
- `agent-docs/code-style-guidelines.md`: Not what you're coding, but how you code. This file is read-only instructions to make your generated code more human-friendly and human-maintainable. Goes over code structure, comments, etc.
- `agent-docs/browser-verification-readiness.md`: Guidelines for structuring the repo so that you can use your /checks skill. This skill allows you to easily inspect the UI and use browser automations. It requires certain auth structures though. If you do not have a /checks skill, you can disregard this.
- `agent-docs/ui-ux-conventions.md`: Guidelines on design. This is a graphic designer's POV. 
- `agent-docs/architecture/overview.md`: Overview of the app's purpose and architecture generally. Include major frontend url endpoints, major backend endpoints, etc. You caninclude data flows, integration boundaries etc. if it is important and distinctive to the app.

Folders: 

- `agent-docs/architecture/`: Document major design decisions.
- `agent-docs/bug-fixes/`: Short notes on important bugs that may regress.
- `agent-docs/regression-tests/`: If you end up needing to fix a bug that is already documented (i.e. it has regressed), add a regression-tests md file, or potentially even a test file (keep these sparing). This is to make sure we do not continue to regress things.

