/* eslint-disable no-console */

/**
 * Small helper script to print the current network configuration
 * based on environment variables.
 *
 * Usage:
 *   ts-node scripts/print-network-config.ts
 *
 * or via a package.json script.
 */

function main() {
  const network = process.env.HARDHAT_NETWORK || "localhost";
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const etherscanKey = process.env.ETHERSCAN_KEY ? "set" : "not set";

  console.log("Stablecoin EVM network configuration:");
  console.log(`  HARDHAT_NETWORK: ${network}`);
  console.log(`  RPC_URL: ${rpcUrl}`);
  console.log(`  ETHERSCAN_KEY: ${etherscanKey}`);
}

main();
