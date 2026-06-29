const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "bin", "cli.js");
const templateRoot = path.join(root, "templates");
const agentDocsTemplateRoot = path.join(root, "templates", "agent-docs");
const START = "<!-- ai-docs-hmd:start -->";
const END = "<!-- ai-docs-hmd:end -->";

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `ai-docs-hmd-${name}-`));
}

function run(args, cwd) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`Command failed:
stdout:
${result.stdout}
stderr:
${result.stderr}`);
  }

  return result;
}

function runRaw(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function exists(file) {
  return fs.existsSync(file);
}

function count(text, needle) {
  return text.split(needle).length - 1;
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
    return `${rendered.slice(startIndex, endIndex + END.length)}\n`;
  }

  return `${managedBlock(rendered.trimEnd())}\n`;
}

function toPosixPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function listMarkdownTemplates(rootDir, current = "") {
  const directory = path.join(rootDir, current);
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
      files.push(...listMarkdownTemplates(rootDir, relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

function templateFiles() {
  return listMarkdownTemplates(agentDocsTemplateRoot);
}

function entryTemplateFiles() {
  return listMarkdownTemplates(templateRoot)
    .map(toPosixPath)
    .filter((file) => !file.startsWith("agent-docs/"));
}

function firstTemplateFile() {
  const [first] = templateFiles();
  assert.ok(first, "Expected at least one agent-docs template");
  return first;
}

function firstEntryTemplateFile() {
  const [first] = entryTemplateFiles();
  assert.ok(first, "Expected at least one entry template");
  return first;
}

function renderedAgentDocTemplate(templateFile) {
  return renderedManagedBlock(read(path.join(agentDocsTemplateRoot, templateFile)));
}

{
  const repo = tempDir("fresh");
  run([], repo);

  for (const entryTemplate of entryTemplateFiles()) {
    assert.strictEqual(
      read(path.join(repo, entryTemplate)),
      read(path.join(templateRoot, entryTemplate)),
    );
  }

  for (const templateFile of templateFiles()) {
    const outputFile = toPosixPath(path.join("agent-docs", templateFile));
    assert.strictEqual(
      read(path.join(repo, outputFile)),
      read(path.join(agentDocsTemplateRoot, templateFile)),
    );
  }
}

{
  const repo = tempDir("default-conflict");
  run([], repo);

  const result = runRaw([], repo);
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to scaffold because these template files already exist/);
  assert.match(result.stderr, /AGENTS\.md/);
  assert.match(result.stderr, /--force/);
}

{
  const repo = tempDir("merge");
  const entryFile = firstEntryTemplateFile();
  const templateFile = firstTemplateFile();
  const outputFile = path.join(repo, "agent-docs", templateFile);

  fs.mkdirSync(path.dirname(path.join(repo, entryFile)), { recursive: true });
  fs.writeFileSync(path.join(repo, entryFile), "# Existing\n\nKeep me.\n", "utf8");
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, "# Existing Template File\n", "utf8");

  run(["--merge"], repo);
  run(["--merge"], repo);

  const entry = read(path.join(repo, entryFile));
  const doc = read(outputFile);
  assert.match(entry, /Keep me\./);
  assert.strictEqual(count(entry, START), 1);
  assert.match(doc, /# Existing Template File/);
  assert.strictEqual(count(doc, START), 1);
}

{
  const repo = tempDir("migrate-unmanaged-entry");
  const cursorFile = path.join(repo, ".cursor", "agents.md");

  fs.mkdirSync(path.dirname(cursorFile), { recursive: true });
  fs.writeFileSync(
    cursorFile,
    "Primary agent instructions live in `../AGENTS.md`. Read and follow that file before making changes.\n",
    "utf8",
  );

  run(["--merge"], repo);
  run(["--merge"], repo);

  const cursor = read(cursorFile);
  assert.strictEqual(count(cursor, START), 1);
  assert.strictEqual(count(cursor, "Primary agent instructions live"), 1);
}

{
  const repo = tempDir("migrate-managed-entry");
  const cursorFile = path.join(repo, ".cursor", "agents.md");

  fs.mkdirSync(path.dirname(cursorFile), { recursive: true });
  fs.writeFileSync(
    cursorFile,
    `${START}
Primary agent instructions live in \`../AGENTS.md\`. Read and follow that file before making changes.
${END}
`,
    "utf8",
  );

  run(["--merge"], repo);
  run(["--merge"], repo);

  const cursor = read(cursorFile);
  assert.strictEqual(count(cursor, START), 1);
  assert.strictEqual(count(cursor, "Primary agent instructions live"), 1);
}

{
  const repo = tempDir("force");
  const entryFile = firstEntryTemplateFile();
  const templateFile = firstTemplateFile();
  const outputFile = path.join(repo, "agent-docs", templateFile);

  fs.mkdirSync(path.dirname(path.join(repo, entryFile)), { recursive: true });
  fs.writeFileSync(path.join(repo, entryFile), "# Existing\n\nKeep me.\n", "utf8");
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, "# Existing Template File\n", "utf8");

  run(["--force"], repo);

  assert.strictEqual(read(path.join(repo, entryFile)), read(path.join(templateRoot, entryFile)));
  assert.strictEqual(read(outputFile), read(path.join(agentDocsTemplateRoot, templateFile)));
}

{
  const repo = tempDir("dry");
  run(["--dry-run"], repo);

  assert.strictEqual(fs.readdirSync(repo).length, 0);
}

{
  const repo = tempDir("target");
  const target = path.join(repo, "nested");
  run(["init", "--target", target], root);

  assert.ok(exists(path.join(target, firstEntryTemplateFile())));
}

{
  const templateDir = path.join(root, "templates", "agent-docs", "dynamic-test");
  const templateFile = path.join(templateDir, "extra.md");

  try {
    fs.mkdirSync(templateDir, { recursive: true });
    fs.writeFileSync(templateFile, "# Extra\n\nDynamic template file.\n", "utf8");

    const repo = tempDir("dynamic-template");
    run([], repo);

    assert.strictEqual(
      read(path.join(repo, "agent-docs", "dynamic-test", "extra.md")),
      "# Extra\n\nDynamic template file.\n",
    );

    fs.rmSync(templateDir, { recursive: true, force: true });

    const repoAfterDelete = tempDir("dynamic-template-delete");
    run([], repoAfterDelete);

    assert.ok(!exists(path.join(repoAfterDelete, "agent-docs", "dynamic-test", "extra.md")));
  } finally {
    fs.rmSync(templateDir, { recursive: true, force: true });
  }
}

{
  const entryTemplate = path.join(root, "templates", "EXTRA_ENTRY.md");

  try {
    fs.writeFileSync(
      entryTemplate,
      "# Extra Entry\n\nDynamic entry template.\n",
      "utf8",
    );

    const repo = tempDir("dynamic-entry");
    run([], repo);

    assert.strictEqual(
      read(path.join(repo, "EXTRA_ENTRY.md")),
      "# Extra Entry\n\nDynamic entry template.\n",
    );

    fs.rmSync(entryTemplate, { force: true });

    const repoAfterDelete = tempDir("dynamic-entry-delete");
    run([], repoAfterDelete);

    assert.ok(!exists(path.join(repoAfterDelete, "EXTRA_ENTRY.md")));
  } finally {
    fs.rmSync(entryTemplate, { force: true });
  }
}

console.log("All CLI tests passed.");
