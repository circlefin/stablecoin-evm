#!/usr/bin/env tsx
/**
 * Copyright 2026 Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Create Injective namespace for an existing Fiat Token contract
 *
 * Usage:
 *   npx tsx scripts/injective/createNamespace.ts --network=<local,testnet,mainnet>
 *
 * Required environment variables (all must be set in .env):
 * - FIAT_TOKEN_PROXY_ADDRESS
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
import { PrivateKey } from "@injectivelabs/sdk-ts";
import { createNamespace } from "./namespaceClient";
import { fundAccount } from "../../integration-tests/injective/helpers/faucet";
import { getErc20Denom } from "../../integration-tests/injective/helpers/cosmosClient";
import {
  colors,
  parseNetworkArgs,
  printError,
  printInfo,
  printStep,
  validateEnvVariables,
} from "./utils";

// Load .env file with override
dotenv.config({ override: true });

// ==================================================
// Parse CLI Arguments & Validate Environment Variables
// ==================================================

const network = parseNetworkArgs(process.argv.slice(2));

const REQUIRED_VARS = [
  "FIAT_TOKEN_PROXY_ADDRESS",
  "POLICY_ADMIN_INJ",
  "CONTRACT_HOOK_ADMIN_INJ",
  "ROLE_PERMISSIONS_ADMIN_INJ",
  "ROLE_MANAGERS_ADMIN_INJ",
  "OWNER_PRIVATE_KEY",
];

validateEnvVariables(REQUIRED_VARS);

printInfo("Configuration validated ✓");
printInfo(`Network: ${network.toString()}`);
printInfo(`Fiat Token Proxy: ${process.env.FIAT_TOKEN_PROXY_ADDRESS}`);

// ==================================================
// Main Flow
// ==================================================

async function main() {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  try {
    // Fund owner account if on localnet and has no balance
    if (network.toString() === "local") {
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
      fiatTokenProxyAddress: process.env.FIAT_TOKEN_PROXY_ADDRESS!,
      policyAdmin: process.env.POLICY_ADMIN_INJ!,
      contractHookAdmin: process.env.CONTRACT_HOOK_ADMIN_INJ!,
      rolePermissionsAdmin: process.env.ROLE_PERMISSIONS_ADMIN_INJ!,
      roleManagersAdmin: process.env.ROLE_MANAGERS_ADMIN_INJ!,
      signerPrivateKey: process.env.OWNER_PRIVATE_KEY!,
      network,
      useRestApi: true, // Use REST API to have explicit gas control
    });

    printInfo(`Namespace created! TX: ${txHash} ✓`);

    // ==================================================
    // SUCCESS!
    // ==================================================
    const denom = getErc20Denom(process.env.FIAT_TOKEN_PROXY_ADDRESS!);
    console.log("\n" + "=".repeat(60));
    console.log("        🎉 NAMESPACE CREATED! 🎉");
    console.log("=".repeat(60));
    console.log(`\nNetwork:              ${network.toString()}`);
    console.log(
      `USDC Proxy:           ${process.env.FIAT_TOKEN_PROXY_ADDRESS}`
    );
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
      `   npx tsx scripts/injective/queryNamespace.ts --network=${network.toString()}`
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
        `Query it with: ${colors.cyan}npx tsx scripts/injective/queryNamespace.ts --network=${network.toString()}${colors.reset}`
      );
    }

    console.error(error);
    process.exit(1);
  }
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
}

void main();
