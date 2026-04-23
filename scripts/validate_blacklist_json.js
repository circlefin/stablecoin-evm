#!/usr/bin/env node

/**
 * Small helper to validate the structure of blacklist.remote.json
 * or any other blacklist JSON file.
 *
 * Usage:
 *   node scripts/validate_blacklist_json.js path/to/blacklist.json
 */

const fs = require("fs");
const path = require("path");

function main() {
  const filePath = process.argv[2] || "blacklist.remote.json";
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, "utf8");
  let json;
  try {
    json = JSON.parse(content);
  } catch (error) {
    console.error(`Invalid JSON in ${fullPath}:`, error);
    process.exit(1);
  }

  if (!Array.isArray(json)) {
    console.error("Expected the blacklist file to contain a JSON array.");
    process.exit(1);
  }

  console.log(`✅ ${filePath} is valid JSON and contains ${json.length} entries.`);
}

main();
