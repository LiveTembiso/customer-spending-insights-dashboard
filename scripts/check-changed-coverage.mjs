// Fails when a source file changed since the base branch is under 80% covered
// on lines, statements, functions or branches. Run after `vitest --coverage`.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const THRESHOLD = 80;
const METRICS = ["lines", "statements", "functions", "branches"];
const SKIPPED = ["components/ui/"];

const base = process.argv[2] ?? "origin/main";
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);

const mergeBase = git("merge-base", base, "HEAD")[0];
const changed = new Set([
  ...git("diff", "--name-only", "--diff-filter=AMR", mergeBase),
  ...git("ls-files", "--others", "--exclude-standard"),
]);

const summary = JSON.parse(
  readFileSync("coverage/coverage-summary.json", "utf8"),
);

const checked = Object.entries(summary)
  .filter(([file]) => file !== "total")
  .map(([file, metrics]) => [path.relative(process.cwd(), file), metrics])
  .filter(([file]) => changed.has(file))
  .filter(([file]) => !SKIPPED.some((prefix) => file.startsWith(prefix)));

const failing = checked.filter(([, metrics]) =>
  METRICS.some((metric) => metrics[metric].pct < THRESHOLD),
);

for (const [file, metrics] of failing) {
  const below = METRICS.filter((metric) => metrics[metric].pct < THRESHOLD)
    .map((metric) => `${metric} ${metrics[metric].pct}%`)
    .join(", ");
  console.error(`${file}: ${below}`);
}

if (failing.length > 0) {
  console.error(
    `\n${failing.length} of ${checked.length} changed files are under ${THRESHOLD}% coverage.`,
  );
  process.exit(1);
}
console.log(
  `All ${checked.length} changed files have at least ${THRESHOLD}% coverage.`,
);
