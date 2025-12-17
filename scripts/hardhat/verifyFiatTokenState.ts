/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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
import { Contract, ethers } from "ethers";
import _ from "lodash";
import { hardhatArgumentTypes } from "./hardhatArgumentTypes";
import fs from "fs";
import path from "path";

type TaskArguments = {
  proxyAddress: string;
  deploymentTxHash: string;
};

task(
  "verifyFiatTokenState",
  "Verifies the FiatToken state by checking readonly state and events"
)
  .addParam(
    "proxyAddress",
    "The address of the deployed FiatTokenProxy contract",
    undefined,
    hardhatArgumentTypes.address
  )
  .addParam(
    "deploymentTxHash",
    "The transaction hash of the deployment transaction",
    undefined,
    hardhatArgumentTypes.string
  )
  .setAction(taskAction);

async function taskAction(
  { proxyAddress, deploymentTxHash }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  console.log("Verifying FiatToken state...");
  console.log("Proxy Address:", proxyAddress);
  console.log("Deployment TX:", deploymentTxHash);

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

  // Verify deployment events
  console.log("\nVerifying deployment events...");
  const deploymentEvents = await verifyDeploymentEvents(
    hre,
    proxyAddress,
    deploymentTxHash
  );
  console.log("Deployment events verification complete:", deploymentEvents);
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

async function verifyDeploymentEvents(
  hre: HardhatRuntimeEnvironment,
  proxyAddress: string,
  deploymentTxHash: string
) {
  // Get the deployment transaction receipt
  const receipt =
    await hre.ethers.provider.getTransactionReceipt(deploymentTxHash);
  if (!receipt) {
    throw new Error(`Transaction receipt not found for ${deploymentTxHash}`);
  }

  // Read blacklist addresses from file
  const blacklistFile =
    process.env.BLACKLIST_FILE_NAME || "blacklist.remote.json";
  const blacklistPath = path.join(process.cwd(), blacklistFile);
  const blacklistedAddresses = JSON.parse(
    fs.readFileSync(blacklistPath, "utf8")
  ) as string[];
  console.log("Loaded blacklisted addresses:", blacklistedAddresses);

  // Get the proxy contract interface with ALL possible events
  const proxyInterface = new ethers.Interface([
    "event Upgraded(address implementation)",
    "event AdminChanged(address previousAdmin, address newAdmin)",
    "event BlacklisterChanged(address indexed newBlacklister)",
    "event Blacklisted(address indexed _account)",
    "event OwnershipTransferred(address previousOwner, address newOwner)",
  ]);

  // Parse all events
  console.log("\nAll events from transaction:");
  receipt.logs.forEach((log, index) => {
    try {
      const parsedLog = proxyInterface.parseLog(log);
      console.log(`Event ${index}:`, {
        address: log.address,
        name: parsedLog?.name,
        args: parsedLog?.args,
      });
    } catch (e) {
      console.log(
        `Event ${index}: Could not parse log from address ${log.address}`
      );
      console.log("Log topics:", log.topics);
      console.log("Log data:", log.data);
    }
  });

  // Parse and verify expected events
  const events = receipt.logs
    .map((log) => {
      try {
        return proxyInterface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .filter((log) => log !== null);

  // Get the actual implementation address
  const proxy = await hre.ethers.getContractAt("FiatTokenProxy", proxyAddress);
  const implAddress = await proxy.implementation();
  console.log("\nCurrent state:");
  console.log("Implementation address:", implAddress);
  console.log("Admin address:", await proxy.admin());

  // Expected events based on what we see in the transaction
  const expectedEvents = [
    {
      name: "Upgraded",
      args: [implAddress],
    },
    {
      name: "AdminChanged",
      args: [
        process.env.CREATE2_FACTORY_CONTRACT_ADDRESS,
        process.env.PROXY_ADMIN_ADDRESS,
      ],
    },
    // Add Blacklisted events for each address from the blacklist file
    ...blacklistedAddresses.map((address) => ({
      name: "Blacklisted",
      args: [address],
    })),
    {
      name: "BlacklisterChanged",
      args: [process.env.BLACKLISTER_ADDRESS || process.env.OWNER_ADDRESS],
    },
    {
      name: "OwnershipTransferred",
      args: [
        process.env.CREATE2_FACTORY_CONTRACT_ADDRESS,
        process.env.OWNER_ADDRESS,
      ],
    },
  ];

  // Verify events
  const verification = {
    events: events.map((e) => ({
      name: e?.name,
      args: e?.args,
    })),
    expectedEvents,
    matches:
      events.length === expectedEvents.length &&
      events.every(
        (actual, i) =>
          actual?.name === expectedEvents[i].name &&
          JSON.stringify(actual?.args) ===
            JSON.stringify(expectedEvents[i].args)
      ),
  };

  if (!verification.matches) {
    console.log("\nEvent verification failed. Differences:");
    console.log("Expected events:", JSON.stringify(expectedEvents, null, 2));
    console.log(
      "Actual events:",
      JSON.stringify(
        events.map((e) => ({
          name: e?.name,
          args: e?.args,
        })),
        null,
        2
      )
    );
  }

  return verification;
}
