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

type TaskArguments = {
  masterMinterAddress: string;
  deploymentTxHash: string;
};

task(
  "verifyMasterMinterState",
  "Verifies the MasterMinter state by checking readonly state and events"
)
  .addParam(
    "masterMinterAddress",
    "The address of the deployed MasterMinter contract",
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
  { masterMinterAddress, deploymentTxHash }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  console.log("Verifying MasterMinter state...");
  console.log("MasterMinter Address:", masterMinterAddress);
  console.log("Deployment TX:", deploymentTxHash);

  // Get master minter contract
  const masterMinter = await hre.ethers.getContractAt(
    "MasterMinter",
    masterMinterAddress
  );

  // Verify master minter state
  console.log("\nVerifying master minter state...");
  const masterMinterState = await verifyMasterMinterState(masterMinter);
  console.log("Master minter state verification complete:", masterMinterState);

  // Verify deployment events
  console.log("\nVerifying deployment events...");
  const deploymentEvents = await verifyDeploymentEvents(hre, deploymentTxHash);
  console.log("Deployment events verification complete:", deploymentEvents);
}

async function verifyMasterMinterState(masterMinter: Contract) {
  const state = {
    owner: await masterMinter.owner(),
    minterManager: await masterMinter.getMinterManager(),
  };

  // Verify against expected values from .env
  const expectedState = {
    owner: process.env.MASTER_MINTER_OWNER_ADDRESS,
    minterManager: process.env.FIAT_TOKEN_PROXY_ADDRESS,
  };

  const verification = {
    state,
    expectedState,
    matches: _.isEqual(state, expectedState),
  };

  if (!verification.matches) {
    console.log("Master Minter state verification failed. Differences:");
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
  deploymentTxHash: string
) {
  // Get the deployment transaction receipt
  const receipt =
    await hre.ethers.provider.getTransactionReceipt(deploymentTxHash);
  if (!receipt) {
    throw new Error(`Transaction receipt not found for ${deploymentTxHash}`);
  }

  // Read minters configuration
  const mintersJson = JSON.parse(
    fs.readFileSync(process.env.MINTERS_FILE_NAME || "minters.json", "utf8")
  );
  const minterControllers = mintersJson.minterControllers;
  const minters = mintersJson.minters;
  const minterAllowances = mintersJson.minterAllowances;
  console.log("Loaded minters configuration:", {
    controllers: minterControllers,
    minters,
    allowances: minterAllowances,
  });

  // Define interfaces for master minter events
  const masterMinterInterface = new ethers.Interface([
    "event MinterManagerSet(address indexed oldMinterManager, address indexed newMinterManager)",
    "event MinterConfigured(address indexed sender, address indexed minter, uint256 allowance)",
    "event MinterConfigured(address indexed minter, uint256 allowance)",
    "event ControllerConfigured(address indexed controller, address indexed worker)",
    "event ControllerRemoved(address indexed controller)",
    "event OwnershipTransferred(address previousOwner, address newOwner)",
  ]);

  // Parse all events
  console.log("\nAll events from transaction:");
  receipt.logs.forEach((log, index) => {
    try {
      const parsedLog = masterMinterInterface.parseLog(log);
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
        const parsedLog = masterMinterInterface.parseLog(log);
        if (parsedLog) {
          // Convert BigInt values to strings in args
          const args = parsedLog.args.map((arg) =>
            typeof arg === "bigint" ? arg.toString() : arg
          );
          return {
            name: parsedLog.name,
            args,
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    })
    .filter((log) => log !== null);

  // Expected events based on what we see in the transaction
  const expectedEvents = [
    {
      name: "MinterManagerSet",
      args: [
        process.env.CREATE2_FACTORY_CONTRACT_ADDRESS, // oldMinterManager
        process.env.FIAT_TOKEN_PROXY_ADDRESS, // newMinterManager
      ],
    },
    ...minters
      .map((minter: string, i: number) => [
        {
          name: "ControllerConfigured",
          args: [process.env.CREATE2_FACTORY_CONTRACT_ADDRESS, minter],
        },
        {
          name: "MinterConfigured",
          args: [
            minter,
            (
              BigInt(minterAllowances[i]) *
              BigInt(10) ** BigInt(process.env.TOKEN_DECIMALS || "6")
            ).toString(),
          ],
        },
        {
          name: "MinterConfigured",
          args: [
            minter,
            (
              BigInt(minterAllowances[i]) *
              BigInt(10) ** BigInt(process.env.TOKEN_DECIMALS || "6")
            ).toString(),
          ],
        },
        {
          name: "ControllerConfigured",
          args: [minterControllers[i], minter],
        },
      ])
      .flat(),
    ...(minters.length > 0
      ? [
          {
            name: "ControllerRemoved",
            args: [process.env.CREATE2_FACTORY_CONTRACT_ADDRESS],
          },
        ]
      : []),
    {
      name: "OwnershipTransferred",
      args: [
        process.env.CREATE2_FACTORY_CONTRACT_ADDRESS,
        process.env.MASTER_MINTER_OWNER_ADDRESS,
      ],
    },
  ];

  const verification = {
    events,
    expectedEvents,
    matches:
      events.length === expectedEvents.length &&
      expectedEvents.every((expected) =>
        events.some(
          (actual) =>
            actual?.name === expected.name &&
            _.isEqual(actual?.args, expected.args)
        )
      ),
  };

  if (!verification.matches) {
    console.log("\nEvent verification failed. Differences:");
    console.log("Expected events:", JSON.stringify(expectedEvents, null, 2));
    console.log("Actual events:", JSON.stringify(events, null, 2));
  }

  return verification;
}
