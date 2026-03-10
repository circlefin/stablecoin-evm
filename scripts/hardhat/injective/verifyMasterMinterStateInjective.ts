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

type TaskArguments = {
  masterMinterAddress: string;
};

type MinterConfig = {
  minterControllers: string[];
  minters: string[];
  minterAllowances: number[];
};

task(
  "verifyMasterMinterStateInjective",
  "Verifies the MasterMinter state for Injective by checking readonly state and minter configuration"
)
  .addParam(
    "masterMinterAddress",
    "The address of the deployed MasterMinter contract",
    undefined,
    hardhatArgumentTypes.address
  )
  .setAction(taskAction);

async function taskAction(
  { masterMinterAddress }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  console.log("Verifying MasterMinter state for Injective...");
  console.log("MasterMinter Address:", masterMinterAddress);

  // Get master minter contract
  const masterMinter = await hre.ethers.getContractAt(
    "MasterMinter",
    masterMinterAddress
  );

  // Get FiatToken proxy contract for minter checks
  const proxyAddress = process.env.FIAT_TOKEN_PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("FIAT_TOKEN_PROXY_ADDRESS not set in environment");
  }
  const fiatToken = await hre.ethers.getContractAt(
    "FiatTokenV2_2",
    proxyAddress
  );

  // Verify master minter state
  console.log("\nVerifying master minter state...");
  const masterMinterState = await verifyMasterMinterState(masterMinter);
  console.log("Master minter state verification complete:", masterMinterState);

  // Verify minter configuration
  console.log("\nVerifying minter configuration...");
  const minterConfigVerification = await verifyMinterConfiguration(
    masterMinter,
    fiatToken
  );
  console.log(
    "Minter configuration verification complete:",
    minterConfigVerification
  );
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

/**
 * Reads the minters configuration file
 * @returns The minters configuration
 */
function loadMinterConfiguration(): MinterConfig {
  const mintersFileName = process.env.MINTERS_FILE_NAME || "minters.json";
  const mintersJson = JSON.parse(fs.readFileSync(mintersFileName, "utf8"));
  console.log("Loaded minters configuration from:", mintersFileName);
  console.log("  Controllers:", mintersJson.minterControllers);
  console.log("  Minters:", mintersJson.minters);
  console.log("  Allowances:", mintersJson.minterAllowances);
  return mintersJson;
}

/**
 * Verifies minter configuration by checking on-chain state directly
 * @param masterMinter The MasterMinter contract
 * @param fiatToken The FiatToken contract
 * @returns Verification result
 */
async function verifyMinterConfiguration(
  masterMinter: Contract,
  fiatToken: Contract
) {
  const config = loadMinterConfiguration();
  const decimals = Number(await fiatToken.decimals());

  const results: {
    controller: string;
    expectedMinter: string;
    actualMinter: string;
    isMinter: boolean;
    expectedAllowance: string;
    actualAllowance: string;
    controllerMatches: boolean;
    allowanceMatches: boolean;
  }[] = [];

  for (let i = 0; i < config.minterControllers.length; i++) {
    const controller = config.minterControllers[i];
    const expectedMinter = config.minters[i];
    const expectedAllowance = (
      BigInt(config.minterAllowances[i]) *
      BigInt(10) ** BigInt(decimals)
    ).toString();

    // Check controller -> minter mapping
    const actualMinter = await masterMinter.getWorker(controller);
    const controllerMatches = actualMinter === expectedMinter;

    // Check if minter is registered
    const isMinter = await fiatToken.isMinter(expectedMinter);

    // Check minter allowance
    const actualAllowance = (
      await fiatToken.minterAllowance(expectedMinter)
    ).toString();
    const allowanceMatches = actualAllowance === expectedAllowance;

    results.push({
      controller,
      expectedMinter,
      actualMinter,
      isMinter,
      expectedAllowance,
      actualAllowance,
      controllerMatches,
      allowanceMatches,
    });

    console.log(`\n  Minter ${i + 1}:`);
    console.log(`    Controller: ${controller}`);
    console.log(
      `    Minter: ${expectedMinter} (actual: ${actualMinter}) - ${controllerMatches}`
    );
    console.log(`    Is Minter: ${isMinter}`);
    console.log(
      `    Allowance: ${expectedAllowance} (actual: ${actualAllowance}) - ${allowanceMatches}`
    );
  }

  const allMatches = results.every(
    (r) => r.controllerMatches && r.isMinter && r.allowanceMatches
  );

  const verification = {
    results,
    matches: allMatches,
  };

  if (!verification.matches) {
    console.log("\nMinter configuration verification failed. Issues:");
    results.forEach((r, i) => {
      if (!r.controllerMatches) {
        console.log(
          `  Minter ${i + 1}: Controller ${r.controller} maps to ${r.actualMinter}, expected ${r.expectedMinter}`
        );
      }
      if (!r.isMinter) {
        console.log(
          `  Minter ${i + 1}: ${r.expectedMinter} is not registered as a minter`
        );
      }
      if (!r.allowanceMatches) {
        console.log(
          `  Minter ${i + 1}: Allowance is ${r.actualAllowance}, expected ${r.expectedAllowance}`
        );
      }
    });
  }

  return verification;
}
