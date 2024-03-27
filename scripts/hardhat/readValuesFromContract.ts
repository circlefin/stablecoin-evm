/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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
import _ from "lodash";
import { hardhatArgumentTypes } from "./hardhatArgumentTypes";
import { Contract } from "ethers";

type TaskArguments = {
  contractName: string;
  contractAddress: string;
  functionNames: string[];
};

task(
  "readValuesFromContract",
  "Calls a series of read-only functions with no arguments on a contract, and prints the results to console."
)
  .addParam(
    "contractName",
    "The contract name eg. FiatTokenV2_1",
    undefined,
    hardhatArgumentTypes.string
  )
  .addParam(
    "contractAddress",
    "The address of the contract",
    undefined,
    hardhatArgumentTypes.address
  )
  .addVariadicPositionalParam(
    "functionNames",
    "The functions to call",
    undefined,
    hardhatArgumentTypes.string
  )
  .setAction(taskAction);

async function taskAction(
  { contractName, contractAddress, functionNames }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  const contract = await hre.ethers.getContractAt(
    contractName,
    contractAddress
  );

  if (contract.getDeployedCode() == null) {
    throw new Error(`Cannot find contract at address '${contractAddress}'!`);
  }

  const viewFunctionResults = await Promise.all(
    functionNames.map((funcName) =>
      conditionallyReadValues(hre, contract, contractName, funcName)
    )
  );

  const result = _.fromPairs(_.zip(functionNames, viewFunctionResults));
  console.log(result);
}

/**
 * Memory addresses for the return data of certain read-only functions
 * on the FiatTokenProxy contract.
 */
const FiatTokenProxy_SLOT_ADDRESSES: Record<string, string> = {
  admin: "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b",
  implementation:
    "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3",
};

/**
 * Conditionally calls a read-only function from a contract, depending on the contractName.
 *
 * If the contract is FiatTokenProxy, and either `name()` or `implementation()` is requested,
 * then read the values from the storage addresses. Otherwise, get the result by calling the function.
 */
async function conditionallyReadValues(
  hre: HardhatRuntimeEnvironment,
  contract: Contract,
  contractName: string,
  functionName: string
) {
  if (!contract[functionName]) {
    throw new Error(`Cannot find ${functionName} in contract!`);
  }

  if (
    contractName === "FiatTokenProxy" &&
    ["admin", "implementation"].includes(functionName)
  ) {
    const storageResult = await hre.ethers.provider.getStorage(
      await contract.getAddress(),
      FiatTokenProxy_SLOT_ADDRESSES[functionName]
    );
    return hre.ethers.getAddress("0x" + storageResult.slice(26));
  }

  return await contract[functionName].staticCall();
}
