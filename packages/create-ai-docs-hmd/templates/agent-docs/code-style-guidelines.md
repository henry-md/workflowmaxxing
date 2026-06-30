
## Making your code readable to future humans

- Comments: WRITE THEM! Add single-line comments above large functions or complex pieces of functionality. Do NOT over-engineer comments with 5 lines of inputs and outputs. Just write a single line explaining what the code does, like `// Does X Y Z`. Try to make the codebase approachable to new developers.
  - For logic-heavy files like backend ts/js files: As a general rule of thumb, there should be about a comment every 100 lines
  - In HTML, you can use them sparingly. It's a good idea to include a comment above every component at least describing what frontend url it's served on, what it does, what component it lives in, anything else important. Again, do not bloat these comments.
- No 'God files': Try to limit the size files get. If you have one giant component approaching 5k lines, heavily consider splitting the component to handle functionality separately.

## Agent-docs authoring

- When editing `agent-docs`, prefer generic language and reusable principles so the docs transfer cleanly to future repos. These docs are most valuable when they teach durable patterns instead of locking the guidance to one codebase's temporary route names, feature labels, or implementation details.
- Use repo-specific examples only when they clarify the rule, and keep them clearly framed as examples rather than the rule itself. Future agents should be able to reuse the guidance even when the next repo has different pages, frameworks, or auth providers.
