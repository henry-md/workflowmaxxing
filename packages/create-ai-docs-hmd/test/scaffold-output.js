const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const packageRoot = path.resolve(__dirname, "..");
const templateRoot = path.join(packageRoot, "templates");
const agentDocsTemplateRoot = path.join(packageRoot, "templates", "agent-docs");

function toPosixPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

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

function entryTemplateFiles() {
  return listMarkdownTemplates(templateRoot)
    .map(toPosixPath)
    .filter((file) => !file.startsWith("agent-docs/"));
}

function requiredFiles() {
  return [
    "readme.md",
    ...entryTemplateFiles(),
    ...listMarkdownTemplates(agentDocsTemplateRoot).map((file) => toPosixPath(path.join("agent-docs", file))),
  ];
}

function repoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: packageRoot,
    encoding: "utf8",
  });

  if (result.status === 0) {
    return result.stdout.trim();
  }

  return path.resolve(packageRoot, "../..");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    encoding: "utf8",
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function verify(target) {
  const missing = requiredFiles().filter((file) => !fs.existsSync(path.join(target, file)));

  if (missing.length > 0) {
    console.error("Missing expected scaffold files:");
    for (const file of missing) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }
}

function twoDigits(value) {
  return String(value).padStart(2, "0");
}

function timestamp(date) {
  const month = twoDigits(date.getMonth() + 1);
  const day = twoDigits(date.getDate());
  const year = twoDigits(date.getFullYear() % 100);
  const hour = twoDigits((date.getHours() % 12) || 12);
  const minute = twoDigits(date.getMinutes());
  const second = twoDigits(date.getSeconds());

  return `${month}/${day}/${year} ${hour}:${minute}:${second}`;
}

function hasFlag(args, name) {
  return args.includes(name);
}

const root = repoRoot();
const forwardedArgs = process.argv.slice(2);
const targetRoot = process.env.AI_DOCS_HMD_TEST_ROOT || root;
const target = path.join(targetRoot, "test-output");
const isMergeTest = hasFlag(forwardedArgs, "--merge");
const isForceTest = hasFlag(forwardedArgs, "--force");

fs.mkdirSync(target, { recursive: true });

const cliArgs = [path.join(packageRoot, "bin/cli.js"), ...forwardedArgs];

run(process.execPath, cliArgs, { cwd: target });

fs.writeFileSync(path.join(target, "readme.md"), `last run: ${timestamp(new Date())}\n`, "utf8");
verify(target);

const label = isMergeTest
  ? "Merge test reran against existing output"
  : isForceTest
    ? "Force test overwrote existing output"
    : "Fresh default test output created";

console.log(`\n${label} at:\n${target}`);
