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
 *
 * Initialize the implementation and proxy contracts using the TypeScript helper
 * script. This is required because `FiatTokenInjectiveV2_2.initialize()` calls the
 * Injective bank precompile which doesn't exist in Foundry's simulation
 * environment.
 *
 * Usage:
 * npx tsx scripts/deploy/injective/initialize-injective.ts --network=<local,testnet,mainnet>
 *
 * Required environment variables (all must be set in .env):
 * - DEPLOYER_PRIVATE_KEY
 * - OWNER_ADDRESS
 * - PAUSER_ADDRESS
 * - BLACKLISTER_ADDRESS
 * - TOKEN_NAME
 * - TOKEN_SYMBOL
 * - TOKEN_CURRENCY
 * - TOKEN_DECIMALS
 * - FIAT_TOKEN_IMPLEMENTATION_ADDRESS
 * - FIAT_TOKEN_PROXY_ADDRESS
 * - MASTER_MINTER_CONTRACT_ADDRESS
 * - RPC_URL
 * - BLACKLIST_FILE_NAME
 *
 * See .env.example for details.
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import fiatTokenInjectiveArtifact from "../../../artifacts/hardhat/contracts/v2/injective/FiatTokenInjectiveV2_2.sol/FiatTokenInjectiveV2_2.json";
import { parseNetworkArgs } from "../../injective/utils";
import { Network } from "@injectivelabs/networks";

// Load environment variables
dotenv.config();

// ============ Types ============

interface InitializeConfig {
  tokenName: string;
  tokenSymbol: string;
  tokenCurrency: string;
  tokenDecimals: number;
  ownerAddress: string;
  pauserAddress: string;
  blacklisterAddress: string;
  implementationAddress: string;
  proxyAddress: string;
  masterMinterAddress: string;
  rpcUrl: string;
  deployerPrivateKey: string;
  accountsToBlacklist: string[];
}

// ============ Constants ============

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

// ============ Configuration ============

/**
 * Load blacklist addresses from a JSON file
 * @param fileName - The name of the blacklist file (e.g., "test.blacklist.remote.json")
 * @returns Array of addresses to blacklist
 */
function loadBlacklist(fileName: string | undefined): string[] {
  if (!fileName) {
    console.log("No BLACKLIST_FILE_NAME specified, using empty blacklist");
    return [];
  }

  const filePath = path.resolve(process.cwd(), fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Blacklist file not found at ${filePath}`);
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const addresses = JSON.parse(fileContent) as string[];

    // Validate that all entries are valid addresses
    for (const addr of addresses) {
      if (!ethers.isAddress(addr)) {
        throw new Error(`Invalid address in blacklist: ${addr}`);
      }
    }

    console.log(
      `Loaded ${addresses.length} addresses from blacklist file: ${fileName}`
    );
    return addresses;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse blacklist file ${fileName}: Invalid JSON`
      );
    }
    throw error;
  }
}

function loadEnvConfig(network: Network): InitializeConfig {
  const rpcUrl = (() => {
    switch (network) {
      case Network.Local:
        return "http://localhost:8545";
      case Network.Testnet:
        return process.env.TESTNET_RPC_URL;
      case Network.Mainnet:
        return process.env.MAINNET_RPC_URL;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  })();

  // Required variables
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const ownerAddress = process.env.OWNER_ADDRESS;
  const pauserAddress = process.env.PAUSER_ADDRESS;
  const blacklisterAddress = process.env.BLACKLISTER_ADDRESS;
  const tokenName = process.env.TOKEN_NAME;
  const tokenSymbol = process.env.TOKEN_SYMBOL;
  const tokenCurrency = process.env.TOKEN_CURRENCY;
  const tokenDecimalsStr = process.env.TOKEN_DECIMALS;
  const implementationAddress = process.env.FIAT_TOKEN_IMPLEMENTATION_ADDRESS;
  const proxyAddress = process.env.FIAT_TOKEN_PROXY_ADDRESS;
  const masterMinterAddress = process.env.MASTER_MINTER_CONTRACT_ADDRESS;

  // Validate required variables
  if (
    !deployerPrivateKey ||
    !ownerAddress ||
    !pauserAddress ||
    !blacklisterAddress ||
    !tokenName ||
    !tokenSymbol ||
    !tokenCurrency ||
    !tokenDecimalsStr ||
    !implementationAddress ||
    !proxyAddress ||
    !masterMinterAddress ||
    !rpcUrl
  ) {
    throw new Error("Missing required environment variables in .env file");
  }

  const tokenDecimals = parseInt(tokenDecimalsStr, 10);
  if (isNaN(tokenDecimals)) {
    throw new Error("TOKEN_DECIMALS must be a valid number");
  }

  // Load blacklist from file (optional)
  const blacklistFileName = process.env.BLACKLIST_FILE_NAME;
  const accountsToBlacklist = loadBlacklist(blacklistFileName);

  if (accountsToBlacklist.find((addr) => addr === proxyAddress) === undefined) {
    throw new Error(
      `Proxy address ${proxyAddress} is NOT in the accounts to blacklist`
    );
  }

  return {
    deployerPrivateKey,
    ownerAddress,
    pauserAddress,
    blacklisterAddress,
    tokenName,
    tokenSymbol,
    tokenCurrency,
    tokenDecimals,
    implementationAddress,
    proxyAddress,
    masterMinterAddress,
    rpcUrl,
    accountsToBlacklist,
  };
}

// ============ Initialization Functions ============

/**
 * Initialize implementation with throwaway values to prevent reinitialization
 */
async function initializeImplementation(
  wallet: ethers.Wallet,
  implementationAddress: string
): Promise<void> {
  console.log("\n=== Initializing Implementation ===");
  console.log(`Implementation address: ${implementationAddress}`);

  const implementation = new ethers.Contract(
    implementationAddress,
    fiatTokenInjectiveArtifact.abi,
    wallet
  );

  const initParams = {
    tokenName: "",
    tokenSymbol: "",
    tokenCurrency: "",
    tokenDecimals: 0,
    newMasterMinter: THROWAWAY_ADDRESS,
    newPauser: THROWAWAY_ADDRESS,
    newBlacklister: THROWAWAY_ADDRESS,
    newOwner: THROWAWAY_ADDRESS,
    accountsToBlacklist: [],
  };

  console.log("Initializing implementation with throwaway values...");
  const tx = await implementation.initialize(initParams);
  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();

  console.log("Implementation initialized successfully!");
}

/**
 * Initialize proxy with actual token configuration
 */
async function initializeProxy(
  wallet: ethers.Wallet,
  proxyAddress: string,
  masterMinterAddress: string,
  config: InitializeConfig
): Promise<void> {
  console.log("\n=== Initializing Proxy ===");
  console.log(`Proxy address: ${proxyAddress}`);
  console.log(`Token name: ${config.tokenName}`);
  console.log(`Token symbol: ${config.tokenSymbol}`);
  console.log(`Token currency: ${config.tokenCurrency}`);
  console.log(`Token decimals: ${config.tokenDecimals}`);
  console.log(`Master minter: ${masterMinterAddress}`);
  console.log(`Pauser: ${config.pauserAddress}`);
  console.log(`Blacklister: ${config.blacklisterAddress}`);
  console.log(`Owner: ${config.ownerAddress}`);
  console.log(`Accounts to blacklist: ${config.accountsToBlacklist.length}`);

  // Verify deployer has sufficient balance for denom creation fee + gas
  // Gas is paid separately from msg.value, so we need extra for tx fees
  if (!wallet.provider) {
    throw new Error("Wallet provider is not available");
  }

  const fiatToken = new ethers.Contract(
    proxyAddress,
    fiatTokenInjectiveArtifact.abi,
    wallet
  );

  const initParams = {
    tokenName: config.tokenName,
    tokenSymbol: config.tokenSymbol,
    tokenCurrency: config.tokenCurrency,
    tokenDecimals: config.tokenDecimals,
    newMasterMinter: masterMinterAddress,
    newPauser: config.pauserAddress,
    newBlacklister: config.blacklisterAddress,
    newOwner: config.ownerAddress,
    accountsToBlacklist: config.accountsToBlacklist,
  };

  console.log("Initializing proxy with token configuration...");
  const tx = await fiatToken.initialize(initParams);
  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();

  console.log("Proxy initialized successfully!");
}

// ============ Main Function ============

async function main() {
  const args = process.argv.slice(2);
  const network = parseNetworkArgs(args);

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `  Injective FiatToken Initialization (${network.toUpperCase()})`
  );
  console.log("=".repeat(60));

  // Load configuration
  const config = loadEnvConfig(network);

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.deployerPrivateKey, provider);

  console.log(`\nDeployer address: ${wallet.address}`);
  console.log(`Implementation: ${config.implementationAddress}`);
  console.log(`Proxy: ${config.proxyAddress}`);
  console.log(`MasterMinter: ${config.masterMinterAddress}`);

  try {
    // Step 1: Initialize implementation
    await initializeImplementation(wallet, config.implementationAddress);

    // Step 2: Initialize proxy
    await initializeProxy(
      wallet,
      config.proxyAddress,
      config.masterMinterAddress,
      config
    );

    console.log(`\n${"=".repeat(60)}`);
    console.log("  Initialization Complete");
    console.log("=".repeat(60));
    console.log("All initialization steps completed successfully!");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\nInitialization failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
