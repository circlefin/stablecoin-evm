#!/usr/bin/env tsx

/**
 * Create Injective namespace for an existing USDC contract
 *
 * Usage:
 *   npx tsx scripts/injective/createNamespace.ts
 *
 * Required environment variables (all must be set in .env):
 * - NETWORK (local, testnet, or mainnet)
 * - USDC_PROXY_ADDRESS
 * - POLICY_ADMIN_INJ
 * - CONTRACT_HOOK_ADMIN_INJ
 * - ROLE_PERMISSIONS_ADMIN_INJ
 * - ROLE_MANAGERS_ADMIN_INJ
 * - OWNER_PRIVATE_KEY
 *
 * See .env.example for details.
 */

import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { Network } from "@injectivelabs/networks";
import { PrivateKey } from "@injectivelabs/sdk-ts";
import { createNamespace } from "./namespaceClient";
import { fundAccount } from "../../integration-tests/injective/helpers/faucet";
import { getErc20Denom } from "../../integration-tests/injective/helpers/cosmosClient";

// Load .env file with override
dotenv.config({ override: true });

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  cyan: "\x1b[0;36m",
};

function printInfo(message: string): void {
  console.log(`${colors.green}[INFO]${colors.reset} ${message}`);
}

function printError(message: string): void {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function printStep(message: string): void {
  console.log(`\n${colors.cyan}[STEP]${colors.reset} ${message}`);
}

// ==================================================
// Validate Required Environment Variables
// ==================================================

const REQUIRED_VARS = [
  "NETWORK",
  "USDC_PROXY_ADDRESS",
  "POLICY_ADMIN_INJ",
  "CONTRACT_HOOK_ADMIN_INJ",
  "ROLE_PERMISSIONS_ADMIN_INJ",
  "ROLE_MANAGERS_ADMIN_INJ",
  "OWNER_PRIVATE_KEY",
];

printInfo("Validating required environment variables...");

const missingVars: string[] = [];
for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  printError("Missing required environment variables:");
  missingVars.forEach((v) => console.log(`  - ${v}`));
  console.log(
    "\nPlease set these variables in your .env file (see .env.example)"
  );
  process.exit(1);
}

// Validate network value
const validNetworks = ["local", "testnet", "mainnet"];
const network = process.env.NETWORK?.toLowerCase();
if (!network || !validNetworks.includes(network)) {
  printError(`Invalid NETWORK value: ${network || "(empty)"}`);
  console.log(`\nSupported networks: ${validNetworks.join(", ")}`);
  process.exit(1);
}

const networkMap: Record<string, Network> = {
  local: Network.Local,
  testnet: Network.Testnet,
  mainnet: Network.Mainnet,
};

printInfo("Configuration validated ✓");
printInfo(`Network: ${network}`);
printInfo(`USDC Proxy: ${process.env.USDC_PROXY_ADDRESS}`);

// ==================================================
// Main Flow
// ==================================================

async function main() {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  try {
    // Fund owner account if on localnet and has no balance
    if (network === "local") {
      printStep("Checking owner account balance...");

      const ownerKey = PrivateKey.fromHex(
        process.env.OWNER_PRIVATE_KEY!.replace("0x", "")
      );
      const ownerInjectiveAddress = ownerKey.toBech32();
      printInfo(`Owner address: ${ownerInjectiveAddress}`);

      // Check balance using ethers (EVM balance)
      const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!);
      const ownerEvmAddress = ownerWallet.address;

      const provider = new ethers.JsonRpcProvider("http://localhost:8545");
      const balance = await provider.getBalance(ownerEvmAddress);

      if (balance === BigInt(0)) {
        printInfo("Owner account has no balance, funding...");
        await fundAccount(ownerInjectiveAddress, "1000000000000000000000"); // 1000 INJ
        printInfo("Owner account funded ✓");
      } else {
        printInfo(`Owner balance: ${ethers.formatEther(balance)} ETH ✓`);
      }
    }

    printStep("Creating Injective namespace...");

    const txHash = await createNamespace({
      usdcProxyAddress: process.env.USDC_PROXY_ADDRESS!,
      policyAdmin: process.env.POLICY_ADMIN_INJ!,
      contractHookAdmin: process.env.CONTRACT_HOOK_ADMIN_INJ!,
      rolePermissionsAdmin: process.env.ROLE_PERMISSIONS_ADMIN_INJ!,
      roleManagersAdmin: process.env.ROLE_MANAGERS_ADMIN_INJ!,
      signerPrivateKey: process.env.OWNER_PRIVATE_KEY!,
      network: networkMap[network!],
      useRestApi: true, // Use REST API to have explicit gas control
    });

    printInfo(`Namespace created! TX: ${txHash} ✓`);

    // ==================================================
    // SUCCESS!
    // ==================================================
    const denom = getErc20Denom(process.env.USDC_PROXY_ADDRESS!);
    console.log("\n" + "=".repeat(60));
    console.log("        🎉 NAMESPACE CREATED! 🎉");
    console.log("=".repeat(60));
    console.log(`\nNetwork:              ${network}`);
    console.log(`USDC Proxy:           ${process.env.USDC_PROXY_ADDRESS}`);
    console.log(`Denom:                ${denom}`);
    console.log(`Transaction Hash:     ${txHash}`);
    console.log("\nAdmins configured:");
    console.log(`  Policy Admin:            ${process.env.POLICY_ADMIN_INJ}`);
    console.log(
      `  Contract Hook Admin:     ${process.env.CONTRACT_HOOK_ADMIN_INJ}`
    );
    console.log(
      `  Role Permissions Admin:  ${process.env.ROLE_PERMISSIONS_ADMIN_INJ}`
    );
    console.log(
      `  Role Managers Admin:     ${process.env.ROLE_MANAGERS_ADMIN_INJ}`
    );
    console.log("\nNext steps:");
    console.log("1. Query namespace:");
    console.log(
      `   NETWORK=${network} npx tsx scripts/injective/queryNamespace.ts ${process.env.USDC_PROXY_ADDRESS}`
    );
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    printError(`Namespace creation failed: ${errorMessage}`);

    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("namespace")
    ) {
      console.log(
        `\n${colors.yellow}Hint:${colors.reset} A namespace may already exist for this contract.`
      );
      console.log(
        `Query it with: ${colors.cyan}NETWORK=${network} npx tsx scripts/injective/queryNamespace.ts ${process.env.USDC_PROXY_ADDRESS}${colors.reset}`
      );
    }

    console.error(error);
    process.exit(1);
  }
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
}

void main();
