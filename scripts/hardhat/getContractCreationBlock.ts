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
import { hardhatArgumentTypes } from "./hardhatArgumentTypes";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { sleep } from "./helpers";

type TaskArguments = {
  contractAddress: string;
};

task(
  "getContractCreationBlock",
  "Gets the block number that a contract is created"
)
  .addPositionalParam(
    "contractAddress",
    "The contract address to query",
    undefined,
    hardhatArgumentTypes.address
  )
  .setAction(taskAction);

async function taskAction(
  { contractAddress }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  const endBlock = await hre.ethers.provider.getBlockNumber();
  const creationBlock = await getContractCreationBlock(
    hre,
    contractAddress,
    0,
    endBlock
  );
  if (await isContractCreatedAtBlock(hre, contractAddress, creationBlock)) {
    console.log(
      `Contract '${contractAddress}' was created in block number ${creationBlock}`
    );
  } else {
    console.log(
      `Could not find contract creation block for contract '${contractAddress}'`
    );
  }
}

/**
 * Searches for the creation block for a given contract using binary search.
 * Adapted from https://levelup.gitconnected.com/how-to-get-smart-contract-creation-block-number-7f22f8952be0.
 */
async function getContractCreationBlock(
  hre: HardhatRuntimeEnvironment,
  contractAddress: string,
  startBlock: number,
  endBlock: number
) {
  await sleep(500);
  console.log(`Searching in [${startBlock}, ${endBlock}]`);
  if (startBlock === endBlock) {
    return startBlock;
  }
  const midBlock = Math.floor((startBlock + endBlock) / 2);
  if (await isContractCreatedAtBlock(hre, contractAddress, midBlock)) {
    return getContractCreationBlock(hre, contractAddress, startBlock, midBlock);
  } else {
    return getContractCreationBlock(
      hre,
      contractAddress,
      midBlock + 1,
      endBlock
    );
  }
}

/**
 * Checks if a given contract is created at a given block number
 */
async function isContractCreatedAtBlock(
  hre: HardhatRuntimeEnvironment,
  contractAddress: string,
  block: number
) {
  const code = await hre.ethers.provider.getCode(contractAddress, block);
  return code.length > 2;
}
