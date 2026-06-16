#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");

const START = "<!-- ai-docs-hmd:start -->";
const END = "<!-- ai-docs-hmd:end -->";

const directories = [
  ".cursor",
  "agent-docs",
  "agent-docs/architecture",
  "agent-docs/bug-fixes",
  "agent-docs/regression-tests",
  "agent-docs/skills",
];

const docs = [
  {
    path: "agent-docs/system.md",
    content: `# System

Describe what this system does, who it serves, and the major components involved.

Include stable product URLs, important backend endpoints, external services, and any domain vocabulary that future agents should understand before making changes.
`,
  },
  {
    path: "agent-docs/general-directions.md",
    content: `# General Directions

Capture durable project guidance that should apply across many tasks.

Prefer concise, reusable rules. Add repo-specific examples only when they clarify a broader principle.
`,
  },
  {
    path: "agent-docs/coding-conventions.md",
    content: `# Coding Conventions

Document required coding rules, dependency constraints, migration safety rules, file patterns, naming conventions, and verification commands.

When there are multiple reasonable implementation paths, record the local preference here.
`,
  },
  {
    path: "agent-docs/ui-ux-conventions.md",
    content: `# UI/UX Conventions

Document visual, interaction, accessibility, and product-surface conventions that agents should follow when creating or changing user interfaces.

Prefer concrete reusable rules over one-off taste notes.
`,
  },
  {
    path: "agent-docs/architecture/overview.md",
    content: `# Architecture Overview

Describe the codebase structure, major modules, data flow, integration boundaries, and where common kinds of changes should live.
`,
  },
  {
    path: "agent-docs/skills/README.md",
    content: `# Skills

Each file in this directory defines a reusable task.

Invoke with:
\`/<file-name-in-kebab-case>\`

Example:
\`/write-pr-description\`

Skills are task-specific instructions that direct the agent to perform a job in a repeatable way.

The user may:
- Create a skill manually
- Ask the agent to create a skill
- Invoke a skill using slash commands

Skill files should be concise. Each \`agent-docs/skills/[skill].md\` file should briefly outline what the skill is, what it should do, and any important constraints or steps to follow. The filename should be the skill name in kebab-case, matching the slash command.

Examples:
- \`agent-docs/skills/write-pr-description.md\` -> invoked with \`/write-pr-description\`
- \`agent-docs/skills/refactor-auth-flow.md\` -> invoked with \`/refactor-auth-flow\`

When a relevant skill exists, the agent should follow it.
`,
  },
];

function commonText(prefix) {
  return `See canonical documentation:

- ${prefix}agent-docs/system.md
  High-level description of what the system does and the major components involved. Include important user-facing routes, backend endpoints, service boundaries, and product vocabulary.

- ${prefix}agent-docs/general-directions.md
  Durable project guidance that should apply across many tasks.

- ${prefix}agent-docs/architecture/
  How the codebase is structured and how major systems interact. Use this to understand where new code should live and how components connect.

- ${prefix}agent-docs/coding-conventions.md
  Required coding rules and constraints, such as migration rules, dependency rules, file patterns, naming conventions, and verification commands.

- ${prefix}agent-docs/ui-ux-conventions.md
  Required UI/UX rules and constraints. Follow these when creating or modifying user interfaces.

- ${prefix}agent-docs/bug-fixes/
  Short records of important bugs that may regress. Document what broke, how it was fixed, and focused checks that would catch it.

- ${prefix}agent-docs/regression-tests/
  Targeted regression notes for behavior that has broken repeatedly. Skim relevant files before touching nearby code.

- ${prefix}agent-docs/skills/
  Reusable task instructions that can be invoked by name when a relevant skill exists.

When modifying code, follow the rules defined in these documents. Keep entries concise so the folder remains useful over time.`;
}

const entryFiles = [
  {
    path: "AGENTS.md",
    title: "Codex Agent Instructions",
    body: commonText(""),
  },
  {
    path: "CLAUDE.md",
    title: "Claude Agent Instructions",
    body: commonText(""),
  },
  {
    path: ".cursor/agents.md",
    title: "Cursor Agent Instructions",
    body: commonText("../"),
  },
];

function usage() {
  return `create-ai-docs-hmd ${pkg.version}

Usage:
  npm init ai-docs-hmd@latest
  npx create-ai-docs-hmd@latest
  npx create-ai-docs-hmd@latest init

Options:
  --merge       Preserve existing content and update the managed block. This is the default.
  --force       Overwrite scaffolded files with the canonical templates.
  --dry-run     Print planned changes without writing files.
  --target DIR  Scaffold a specific directory instead of the current directory.
  --version     Print the CLI version.
  --help        Show this help.
`;
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    force: false,
    merge: true,
    target: process.cwd(),
  };

  const args = [...argv];
  if (args[0] === "init") {
    args.shift();
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
      options.merge = false;
    } else if (arg === "--merge") {
      options.merge = true;
      options.force = false;
    } else if (arg === "--target") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("--target requires a directory");
      }
      options.target = path.resolve(value);
      i += 1;
    } else if (arg.startsWith("--target=")) {
      options.target = path.resolve(arg.slice("--target=".length));
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function managedBlock(body) {
  return `${START}
${body}
${END}`;
}

function fullEntryFile(title, body) {
  return `# ${title}

${managedBlock(body)}
`;
}

function mergeEntryFile(existing, title, body) {
  const nextBlock = managedBlock(body);
  const startIndex = existing.indexOf(START);
  const endIndex = existing.indexOf(END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const afterEnd = endIndex + END.length;
    return `${existing.slice(0, startIndex)}${nextBlock}${existing.slice(afterEnd)}`;
  }

  const trimmed = existing.trimEnd();
  if (!trimmed) {
    return fullEntryFile(title, body);
  }

  return `${trimmed}

${nextBlock}
`;
}

function ensureDir(root, relativeDir, options, actions) {
  const absoluteDir = path.join(root, relativeDir);

  if (fs.existsSync(absoluteDir)) {
    actions.unchanged.push(`${relativeDir}/`);
    return;
  }

  actions.created.push(`${relativeDir}/`);
  if (!options.dryRun) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }
}

function writeFile(root, relativePath, content, mode, options, actions) {
  const absolutePath = path.join(root, relativePath);
  const exists = fs.existsSync(absolutePath);
  const existing = exists ? fs.readFileSync(absolutePath, "utf8") : "";
  let next = content;
  let action = "created";

  if (mode === "entry") {
    const entry = entryFiles.find((candidate) => candidate.path === relativePath);
    next = options.force
      ? fullEntryFile(entry.title, entry.body)
      : mergeEntryFile(existing, entry.title, entry.body);
  } else if (exists && !options.force && existing.trim().length > 0) {
    actions.skipped.push(`${relativePath} (exists)`);
    return;
  }

  if (exists && existing === next) {
    actions.unchanged.push(relativePath);
    return;
  }

  if (exists) {
    action = options.force ? "overwritten" : "updated";
  }
  actions[action].push(relativePath);

  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, next, "utf8");
  }
}

function scaffold(options) {
  const root = options.target;
  const actions = {
    created: [],
    updated: [],
    overwritten: [],
    skipped: [],
    unchanged: [],
  };

  if (!options.dryRun) {
    fs.mkdirSync(root, { recursive: true });
  }

  for (const directory of directories) {
    ensureDir(root, directory, options, actions);
  }

  for (const entry of entryFiles) {
    writeFile(root, entry.path, fullEntryFile(entry.title, entry.body), "entry", options, actions);
  }

  for (const doc of docs) {
    writeFile(root, doc.path, doc.content, "doc", options, actions);
  }

  return actions;
}

function printActions(actions, options) {
  const prefix = options.dryRun ? "Would " : "";
  const sections = [
    ["created", "create"],
    ["updated", "update"],
    ["overwritten", "overwrite"],
    ["skipped", "skip"],
    ["unchanged", "leave unchanged"],
  ];

  console.log(`${options.dryRun ? "Dry run for" : "Initialized"} AI docs in ${options.target}`);

  for (const [key, label] of sections) {
    const values = actions[key];
    if (values.length === 0) {
      continue;
    }
    console.log(`\n${prefix}${label}:`);
    for (const value of values) {
      console.log(`  - ${value}`);
    }
  }
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
      console.log(usage());
      return;
    }

    if (options.version) {
      console.log(pkg.version);
      return;
    }

    const actions = scaffold(options);
    printActions(actions, options);
  } catch (error) {
    console.error(`create-ai-docs-hmd: ${error.message}`);
    console.error("Run with --help for usage.");
    process.exitCode = 1;
  }
}

main();
