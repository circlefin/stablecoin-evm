/* eslint-disable no-console */
import { promises as fs } from "fs";
import * as path from "path";

/**
 * Extracts ABI from compiled JSON artifacts in ./artifacts/contracts and writes each ABI to a separate file.
 *
 * Usage: ts-node scripts/abi_extractor.ts
 */
async function main() {
  const artifactsDir = path.resolve("artifacts/contracts");
  const outDir = path.resolve("abis");
  await fs.mkdir(outDir, { recursive: true });

  const files = await fs.readdir(artifactsDir, { recursive: true });
  for (const file of files) {
    if (file.endsWith(".json")) {
      const fullPath = path.join(artifactsDir, file);
      const json = JSON.parse(await fs.readFile(fullPath, "utf8"));
      const abi = json.abi;
      const fileName = path.basename(file).replace(".json", ".abi.json");
      await fs.writeFile(path.join(outDir, fileName), JSON.stringify(abi, null, 2));
      console.log(`Extracted ABI: ${fileName}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
