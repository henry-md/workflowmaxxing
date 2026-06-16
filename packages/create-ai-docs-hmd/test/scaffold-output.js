const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const packageRoot = path.resolve(__dirname, "..");
const requiredFiles = [
  "readme.md",
  "AGENTS.md",
  "CLAUDE.md",
  ".cursor/agents.md",
  "agent-docs/system.md",
  "agent-docs/general-directions.md",
  "agent-docs/coding-conventions.md",
  "agent-docs/ui-ux-conventions.md",
  "agent-docs/architecture/overview.md",
  "agent-docs/skills/README.md",
];

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
  const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(target, file)));

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

const root = repoRoot();
const target = path.join(root, "test-output");
const packagePathFromRoot = path.relative(root, packageRoot);

if (process.argv.includes("--clean")) {
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
  process.exit(0);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

run(process.execPath, [path.join(packageRoot, "bin/cli.js"), "--target", target]);
fs.writeFileSync(path.join(target, "readme.md"), `last run: ${timestamp(new Date())}\n`, "utf8");
verify(target);

console.log(`\nScaffold test output created at:\n${target}`);
console.log(`\nClean up with:\nnpm --prefix ${packagePathFromRoot} run clean:scaffold`);

if (process.argv.includes("--open")) {
  if (process.platform === "darwin") {
    run("open", [target]);
  } else {
    console.log("\nOpen the folder above to inspect the generated files.");
  }
}
