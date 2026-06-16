#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");

const START = "<!-- ai-docs-hmd:start -->";
const END = "<!-- ai-docs-hmd:end -->";
const templateRoot = path.join(__dirname, "..", "templates");
const agentDocsTemplateRoot = path.join(templateRoot, "agent-docs");

function toPosixPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

const baseDirectories = ["agent-docs"];

function listMarkdownTemplates(root, current = "") {
  const directory = path.join(root, current);
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownTemplates(root, relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

function entryTemplatesFromTemplates() {
  return listMarkdownTemplates(templateRoot)
    .map(toPosixPath)
    .filter((relativePath) => !relativePath.startsWith("agent-docs/"))
    .map((relativePath) => {
      return {
        path: relativePath,
        content: renderEntryTemplate(relativePath),
      };
    });
}

function agentDocsFromTemplates() {
  return listMarkdownTemplates(agentDocsTemplateRoot).map((relativePath) => {
    return {
      path: toPosixPath(path.join("agent-docs", relativePath)),
      content: fs.readFileSync(path.join(agentDocsTemplateRoot, relativePath), "utf8"),
    };
  });
}

function entryDirectoriesFromTemplates() {
  const directories = new Set();

  for (const entry of entryTemplatesFromTemplates()) {
    const directory = path.posix.dirname(entry.path);
    if (directory !== ".") {
      directories.add(directory);
    }
  }

  return [...directories].sort();
}

function agentDocDirectoriesFromTemplates() {
  const directories = new Set();

  for (const relativePath of listMarkdownTemplates(agentDocsTemplateRoot)) {
    let directory = path.dirname(relativePath);
    while (directory && directory !== ".") {
      directories.add(toPosixPath(path.join("agent-docs", directory)));
      directory = path.dirname(directory);
    }
  }

  return [...directories].sort();
}

function renderEntryTemplate(relativePath) {
  return fs.readFileSync(path.join(templateRoot, relativePath), "utf8");
}

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

function renderedManagedBlock(rendered) {
  const startIndex = rendered.indexOf(START);
  const endIndex = rendered.indexOf(END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return rendered.slice(startIndex, endIndex + END.length);
  }

  return managedBlock(rendered.trimEnd());
}

function mergeEntryFile(existing, rendered) {
  const nextBlock = renderedManagedBlock(rendered);
  const startIndex = existing.indexOf(START);
  const endIndex = existing.indexOf(END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const afterEnd = endIndex + END.length;
    return `${existing.slice(0, startIndex)}${nextBlock}${existing.slice(afterEnd)}`;
  }

  const trimmed = existing.trimEnd();
  if (!trimmed) {
    return rendered;
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
    next = options.force ? content : mergeEntryFile(existing, content);
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

  for (const directory of [...baseDirectories, ...entryDirectoriesFromTemplates(), ...agentDocDirectoriesFromTemplates()]) {
    ensureDir(root, directory, options, actions);
  }

  for (const entry of entryTemplatesFromTemplates()) {
    writeFile(root, entry.path, entry.content, "entry", options, actions);
  }

  for (const doc of agentDocsFromTemplates()) {
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
