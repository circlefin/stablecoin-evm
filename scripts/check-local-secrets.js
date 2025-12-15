#!/usr/bin/env node

/**
 * Checks for the presence of local-only files that must not be committed:
 *  - .env
 *  - blacklist.remote.json
 *
 * The script warns if the files are present and reminds the user to keep
 * them out of version control.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function isTracked(relPath) {
  try {
    const stdout = execSync(`git ls-files -- ${relPath}`, { encoding: "utf8" });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

function main() {
  const files = [".env", "blacklist.remote.json"];

  console.log("🔎 Checking local-only files…");

  for (const f of files) {
    const exists = fileExists(f);
    const tracked = isTracked(f);

    if (!exists) {
      console.log(`- ${f}: not present (ok)`);
      continue;
    }

    if (tracked) {
      console.warn(`⚠️  ${f} exists and appears to be tracked by git. This should be avoided.`);
    } else {
      console.log(`✅ ${f} exists and is not tracked by git.`);
    }
  }

  console.log("\nReminder: .env and blacklist.remote.json must stay local and out of the repository.");
}

main();
