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

import { readFileSync } from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, LinkReferences } from "hardhat/types";
import _ from "lodash";
import path from "path";
import { hardhatArgumentTypes } from "./hardhatArgumentTypes";

type TaskArguments = {
  contractName: string;
  contractAddress: string;
  libraryName?: string;
  libraryAddress?: string;
  verificationType: "full" | "partial";
};

task(
  "verifyBytecodeOnChain",
  "Verify that the locally compiled bytecode matches the deployed bytecode on chain."
)
  .addParam(
    "contractName",
    "The name of the contract to validate",
    undefined,
    hardhatArgumentTypes.string
  )
  .addParam(
    "contractAddress",
    "The address of the contract to validate",
    undefined,
    hardhatArgumentTypes.address
  )
  .addOptionalParam(
    "libraryName",
    "The name of the library contract the main contract uses",
    undefined,
    hardhatArgumentTypes.string
  )
  .addOptionalParam(
    "libraryAddress",
    "The address of the library contract",
    undefined,
    hardhatArgumentTypes.address
  )
  .addOptionalParam(
    "verificationType",
    "Checks metadata if set to 'full', skips metadata checking if set to 'partial'.",
    "full",
    hardhatArgumentTypes.oneOf(["full", "partial"])
  )
  .setAction(taskAction);

async function taskAction(
  {
    contractName,
    contractAddress,
    libraryName,
    libraryAddress,
    verificationType,
  }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  // Getting contract bytecode from blockchain
  const rawOnchainBytecode = await hre.ethers.provider.getCode(contractAddress);

  // Getting locally compiled bytecode, swap out library contract addresses
  const foundryContractArtifact = JSON.parse(
    readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "artifacts",
        "foundry",
        `${contractName}.sol`,
        `${contractName}.json`
      ),
      "utf-8"
    )
  );

  let rawLocalBytecode: string =
    foundryContractArtifact.deployedBytecode.object;
  const deployedLinkReferences: LinkReferences =
    foundryContractArtifact.deployedBytecode.linkReferences;

  if (libraryName && libraryAddress) {
    const libraryReferencePositions: {
      length: number;
      start: number;
    }[] = _.chain(deployedLinkReferences)
      .values()
      .map(Object.entries)
      .flatten()
      .fromPairs()
      .get(libraryName)
      .value();

    for (const position of libraryReferencePositions) {
      const replacement = libraryAddress
        .slice(2, 2 + position["length"] * 2)
        .toLowerCase();
      rawLocalBytecode =
        rawLocalBytecode.slice(0, 2 + position.start * 2) +
        replacement +
        rawLocalBytecode.slice(2 + position.start * 2 + position["length"] * 2);
    }
  }

  // Compare onchain bytecode against local bytecode
  if (verificationType === "full") {
    logBytecodeComparisonResult(
      rawLocalBytecode,
      rawOnchainBytecode,
      verificationType
    );
  } else {
    const onchainBytecodeNoMetadata = removeMetadataHash(rawOnchainBytecode);
    const localBytecodeNoMetadata = removeMetadataHash(rawLocalBytecode);
    logBytecodeComparisonResult(
      localBytecodeNoMetadata,
      onchainBytecodeNoMetadata,
      verificationType
    );
  }
}

function logBytecodeComparisonResult(
  bytecodeA: string,
  bytecodeB: string,
  verificationType: TaskArguments["verificationType"]
) {
  if (bytecodeA !== bytecodeB) {
    console.log(
      "\x1b[31m",
      `\nWARNING: ${verificationType} verification failed - bytecode on chain differs from local compilation.`
    );
    process.exit(1);
  } else {
    console.log(
      "\x1b[32m",
      `\n${verificationType} verification complete - onchain contract contains the same bytecode.`
    );
    process.exit(0);
  }
}

function removeMetadataHash(contractBytecode: string) {
  const metadataLength = getContractMetadataLength(contractBytecode);
  return contractBytecode.slice(0, contractBytecode.length - metadataLength);
}

function getContractMetadataLength(contractBytecode: string) {
  // Read the last two bytes to determine the length of the CBOR encoding
  // https://docs.soliditylang.org/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
  const metadataLengthHex = contractBytecode.slice(
    contractBytecode.length - 4,
    contractBytecode.length
  );

  const metadataNumBytes = parseInt(metadataLengthHex, 16);
  return metadataNumBytes * 2 + metadataLengthHex.length;
}
