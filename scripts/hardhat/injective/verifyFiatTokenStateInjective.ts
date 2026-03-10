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

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";
import _ from "lodash";
import { hardhatArgumentTypes } from "../hardhatArgumentTypes";
import fs from "fs";
import path from "path";

type TaskArguments = {
  proxyAddress: string;
};

task(
  "verifyFiatTokenStateInjective",
  "Verifies the FiatToken state for Injective by checking readonly state and blacklist status"
)
  .addParam(
    "proxyAddress",
    "The address of the deployed FiatTokenProxy contract",
    undefined,
    hardhatArgumentTypes.address
  )
  .setAction(taskAction);

async function taskAction(
  { proxyAddress }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  console.log("Verifying FiatToken state for Injective...");
  console.log("Proxy Address:", proxyAddress);

  // Get proxy contract
  const proxy = await hre.ethers.getContractAt("FiatTokenProxy", proxyAddress);
  const proxyAsV2_2 = await hre.ethers.getContractAt(
    "FiatTokenV2_2",
    proxyAddress
  );

  // Verify direct state (proxy + token)
  console.log("\nVerifying direct state (proxy + token)...");
  const directState = await verifyDirectState(proxy, proxyAsV2_2);
  console.log("Direct state verification complete:", directState);

  // Verify blacklist state by checking isBlacklisted() for each address
  console.log("\nVerifying blacklist state...");
  const blacklistVerification = await verifyBlacklistState(proxyAsV2_2);
  console.log("Blacklist state verification complete:", blacklistVerification);
}

async function verifyDirectState(proxy: Contract, proxyAsV2_2: Contract) {
  // Gather all state
  const state = {
    admin: await proxy.admin(),
    implementation: await proxy.implementation(),
    name: await proxyAsV2_2.name(),
    symbol: await proxyAsV2_2.symbol(),
    currency: await proxyAsV2_2.currency(),
    decimals: Number(await proxyAsV2_2.decimals()),
    masterMinter: await proxyAsV2_2.masterMinter(),
    owner: await proxyAsV2_2.owner(),
    pauser: await proxyAsV2_2.pauser(),
    rescuer: await proxyAsV2_2.rescuer(),
    blacklister: await proxyAsV2_2.blacklister(),
    totalSupply: (await proxyAsV2_2.totalSupply()).toString(),
  };

  // Expected values from .env
  const expectedState = {
    admin: process.env.PROXY_ADMIN_ADDRESS,
    implementation: process.env.FIAT_TOKEN_IMPLEMENTATION_ADDRESS,
    name: process.env.TOKEN_NAME,
    symbol: process.env.TOKEN_SYMBOL,
    currency: process.env.TOKEN_CURRENCY,
    decimals: parseInt(process.env.TOKEN_DECIMALS || "6"),
    masterMinter: process.env.MASTER_MINTER_CONTRACT_ADDRESS,
    owner: process.env.OWNER_ADDRESS,
    pauser: process.env.PAUSER_ADDRESS || process.env.OWNER_ADDRESS,
    blacklister: process.env.BLACKLISTER_ADDRESS || process.env.OWNER_ADDRESS,
    rescuer:
      process.env.RESCUER_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
    totalSupply: "0", // Initial total supply should be 0
  };

  const verification = {
    state,
    expectedState,
    matches: _.isEqual(state, expectedState),
  };

  if (!verification.matches) {
    console.log("Direct state verification failed. Differences:");
    _.forEach(state, (value, key) => {
      if (value !== expectedState[key as keyof typeof expectedState]) {
        console.log(
          `${key}: Expected ${
            expectedState[key as keyof typeof expectedState]
          }, got ${value}`
        );
      }
    });
  }

  return verification;
}

/**
 * Reads the blacklist file and returns the addresses that should be blacklisted.
 * @returns Array of addresses that should be blacklisted
 */
function getExpectedBlacklistedAddresses(): string[] {
  const blacklistFile =
    process.env.BLACKLIST_FILE_NAME || "blacklist.remote.json";
  const blacklistPath = path.join(process.cwd(), blacklistFile);
  const blacklistedAddresses = JSON.parse(
    fs.readFileSync(blacklistPath, "utf8")
  ) as string[];
  console.log("Loaded expected blacklisted addresses:", blacklistedAddresses);

  return blacklistedAddresses;
}

/**
 * Verifies blacklist state by calling isBlacklisted() on each expected address.
 * This is a read-only operation and does not cost gas.
 * @param proxyAsV2_2 The FiatTokenV2_2 contract instance
 * @returns Verification result containing actual blacklist status for each address
 */
async function verifyBlacklistState(proxyAsV2_2: Contract) {
  // Get expected blacklisted addresses from file
  const expectedBlacklistedAddresses = getExpectedBlacklistedAddresses();

  // Check isBlacklisted() for each address
  const results: {
    address: string;
    isBlacklisted: boolean;
    expected: boolean;
  }[] = [];

  for (const address of expectedBlacklistedAddresses) {
    const isBlacklisted = await proxyAsV2_2.isBlacklisted(address);
    results.push({
      address,
      isBlacklisted,
      expected: true,
    });
    console.log(`  ${address}: isBlacklisted = ${isBlacklisted}`);
  }

  // Check if all expected addresses are blacklisted
  const allBlacklisted = results.every((r) => r.isBlacklisted === r.expected);

  const verification = {
    results,
    matches: allBlacklisted,
  };

  if (!verification.matches) {
    console.log("\nBlacklist state verification failed. Differences:");
    results
      .filter((r) => r.isBlacklisted !== r.expected)
      .forEach((r) => {
        console.log(
          `  ${r.address}: expected isBlacklisted=${r.expected}, got isBlacklisted=${r.isBlacklisted}`
        );
      });
  }

  return verification;
}
