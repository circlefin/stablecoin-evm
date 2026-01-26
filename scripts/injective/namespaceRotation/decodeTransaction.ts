#!/usr/bin/env tsx

/**
 * Decode Signed Transaction
 *
 * Decodes a signed transaction file and outputs JSON.
 *
 * Usage:
 *   npx tsx scripts/injective/namespaceRotation/decodeTransaction.ts <signed_tx.json> [--with-evm-addresses]
 *
 * Example:
 *   npx tsx scripts/injective/namespaceRotation/decodeTransaction.ts signed-tx-local-...json --with-evm-addresses
 */

import * as fs from "fs";
import { getEthereumAddress } from "@injectivelabs/sdk-ts";

/**
 * Add EVM address conversions to objects containing Injective addresses
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addEvmConversions(obj: any): any {
  if (typeof obj === "string" && obj.startsWith("inj1")) {
    return {
      injective: obj,
      evm: getEthereumAddress(obj),
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => addEvmConversions(item));
  }

  if (obj !== null && typeof obj === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = addEvmConversions(value);
    }
    return result;
  }

  return obj;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage: npx tsx scripts/injective/namespaceRotation/decodeTransaction.ts <signed_tx.json> [--with-evm-addresses]"
    );
    process.exit(1);
  }

  const signedTxFile = args[0];
  const withEvmAddresses = args.includes("--with-evm-addresses");

  if (!fs.existsSync(signedTxFile)) {
    console.error(`File not found: ${signedTxFile}`);
    process.exit(1);
  }

  const signedTxData = JSON.parse(fs.readFileSync(signedTxFile, "utf-8"));

  // Extract readable fields
  const decoded = {
    network: signedTxData.network,
    chainId: signedTxData.chainId,
    signer: withEvmAddresses
      ? addEvmConversions(signedTxData.signer)
      : signedTxData.signer,
    accountNumber: signedTxData.accountNumber,
    sequence: signedTxData.sequence,
    message: withEvmAddresses
      ? addEvmConversions(signedTxData.message)
      : signedTxData.message,
    metadata: withEvmAddresses
      ? addEvmConversions(signedTxData.metadata)
      : signedTxData.metadata,
  };

  // Output to console
  console.log(JSON.stringify(decoded, null, 2));

  // Generate output file name based on input file and flags
  const outputFileName = signedTxFile
    .replace("signed-tx-", "decoded-tx-")
    .replace(".json", withEvmAddresses ? "-with-evm.json" : ".json");

  // Write to file
  fs.writeFileSync(outputFileName, JSON.stringify(decoded, null, 2));

  console.log(`\nDecoded transaction written to: ${outputFileName}`);
}

main();
