const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "bin", "cli.js");
const START = "<!-- ai-docs-hmd:start -->";

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

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function exists(file) {
  return fs.existsSync(file);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

{
  const repo = tempDir("fresh");
  run([], repo);

  assert.ok(exists(path.join(repo, "AGENTS.md")));
  assert.ok(exists(path.join(repo, "CLAUDE.md")));
  assert.ok(exists(path.join(repo, ".cursor", "agents.md")));
  assert.ok(exists(path.join(repo, "agent-docs", "system.md")));
  assert.ok(exists(path.join(repo, "agent-docs", "skills", "README.md")));
  assert.match(read(path.join(repo, "AGENTS.md")), /agent-docs\/system\.md/);
  assert.match(read(path.join(repo, ".cursor", "agents.md")), /\.\.\/agent-docs\/system\.md/);
}

{
  const repo = tempDir("merge");
  fs.writeFileSync(path.join(repo, "AGENTS.md"), "# Existing\n\nKeep me.\n", "utf8");
  fs.mkdirSync(path.join(repo, "agent-docs"), { recursive: true });
  fs.writeFileSync(path.join(repo, "agent-docs", "system.md"), "# Existing System\n", "utf8");

  run(["--merge"], repo);
  run(["--merge"], repo);

  const agents = read(path.join(repo, "AGENTS.md"));
  assert.match(agents, /Keep me\./);
  assert.strictEqual(count(agents, START), 1);
  assert.strictEqual(read(path.join(repo, "agent-docs", "system.md")), "# Existing System\n");
}

{
  const repo = tempDir("force");
  fs.writeFileSync(path.join(repo, "AGENTS.md"), "# Existing\n\nKeep me.\n", "utf8");
  fs.mkdirSync(path.join(repo, "agent-docs"), { recursive: true });
  fs.writeFileSync(path.join(repo, "agent-docs", "system.md"), "# Existing System\n", "utf8");

  run(["--force"], repo);

  assert.doesNotMatch(read(path.join(repo, "AGENTS.md")), /Keep me\./);
  assert.notStrictEqual(read(path.join(repo, "agent-docs", "system.md")), "# Existing System\n");
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

  assert.ok(exists(path.join(target, "AGENTS.md")));
}

console.log("All CLI tests passed.");
