/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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

import fs from "fs";
import path from "path";
import {
  logBytecodeComparisonResults,
  TaskArguments as VerifyOnChainBytecodeTaskArguments,
  verifyOnChainBytecode,
  BytecodeVerificationType,
} from "./hardhat/verifyOnChainBytecode";
import hre from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import { ethers } from "ethers";
import { ArtifactType } from "./hardhat/alternativeArtifacts";
import { validateOptimizerRuns } from "./hardhat/helpers";

type ContractInput = {
  contractAddress: string;
  contractCreationTxHash: string;
  metadataFilePath: string;
  verificationType?: BytecodeVerificationType;
  artifactType?: ArtifactType;
  useTracesForCreationBytecode?: boolean;
  optimizerRuns?: number;
};

type InputObject = {
  SignatureChecker: ContractInput;
  FiatTokenV2_2: ContractInput;
  FiatTokenProxy: ContractInput;
  rpcUrl: string;
};

const VERIFICATION_ARTIFACTS_DIR = path.join(
  __dirname,
  "..",
  "verification_artifacts"
);

async function main() {
  const inputFilePath = path.join(VERIFICATION_ARTIFACTS_DIR, "input.json");

  if (!fs.existsSync(inputFilePath)) {
    throw new Error(
      "No input files found. Please check your directory name and file name to make sure it is verification_artifacts/input.json"
    );
  }

  if (hre.network.name !== "mainnet") {
    throw new Error("Hardhat network must be set to 'mainnet'!");
  }

  let failedVerification = 0;
  const input = validateInput(inputFilePath);
  (hre.network.config as HttpNetworkConfig).url = input.rpcUrl;

  const taskArgs = transformInputToVerifyOnChainBytecodeTaskArguments(input);
  for (const taskArg of taskArgs) {
    console.log(`\n Verifying on chain bytecode for: ${taskArg.contractName}`);
    const results = await verifyOnChainBytecode(taskArg, hre);
    logBytecodeComparisonResults(results);

    for (const { equal } of results) {
      if (!equal) {
        failedVerification++;
      }
    }
  }

  if (failedVerification > 0) {
    throw new Error("One or more verifications failed");
  }
}

function validateInput(filename: string): InputObject {
  const input = JSON.parse(fs.readFileSync(filename, "utf-8"));
  if (
    !input.SignatureChecker ||
    !input.FiatTokenV2_2 ||
    !input.FiatTokenProxy ||
    !input.rpcUrl
  ) {
    throw new Error("Missing fields in input file!");
  }
  try {
    // Formats a URL string. Throws a TypeError if the URL string is malformed.
    input.rpcUrl = new URL(input.rpcUrl).toString();
  } catch (e) {
    throw new Error("Invalid URL!");
  }
  for (const key of ["SignatureChecker", "FiatTokenV2_2", "FiatTokenProxy"]) {
    const value = input[key];
    // Ensure all required fields exist
    if (!value.contractAddress || !value.contractCreationTxHash) {
      throw new Error(`Contract config for ${key} contains empty fields`);
    }
    // Validate contractAddress (must be a 20-byte address)
    if (!ethers.isAddress(value.contractAddress)) {
      throw new Error(
        `Invalid contractAddress for ${key}: ${value.contractAddress}`
      );
    }
    // Validate contractCreationTxHash (must be a 32-byte hash)
    if (!ethers.isHexString(value.contractCreationTxHash, 32)) {
      throw new Error(
        `Invalid contractCreationTxHash for ${key}: ${value.contractCreationTxHash}`
      );
    }
    // Validate verificationType if present
    if (
      value.verificationType !== undefined &&
      !Object.values(BytecodeVerificationType).includes(value.verificationType)
    ) {
      throw new Error(
        `Invalid verificationType for ${key}: ${value.verificationType}`
      );
    }
    // Validate artifactType if present
    if (
      value.artifactType !== undefined &&
      !Object.values(ArtifactType).includes(value.artifactType)
    ) {
      throw new Error(`Invalid artifactType for ${key}: ${value.artifactType}`);
    }
    // Validate useTracesForCreationBytecode if present
    if (
      value.useTracesForCreationBytecode !== undefined &&
      typeof value.useTracesForCreationBytecode !== "boolean"
    ) {
      throw new Error(
        `Invalid useTracesForCreationBytecode for ${key}: ${value.useTracesForCreationBytecode}`
      );
    }
    // Validate optimizerRuns if present
    if (value.optimizerRuns !== undefined) {
      try {
        validateOptimizerRuns(value.optimizerRuns);
      } catch (e) {
        throw new Error(
          `Invalid optimizerRuns for ${key}: ${value.optimizerRuns}`
        );
      }
    }

    // If verification type isn't "full," validate metadataFilePath (file must exist)
    if (value.verificationType !== BytecodeVerificationType.Full) {
      const metadataFilePath = path.join(
        VERIFICATION_ARTIFACTS_DIR,
        `${key}.json`
      );
      if (!fs.existsSync(metadataFilePath)) {
        throw new Error(
          `Invalid metadataFilePath for ${key}: File does not exist`
        );
      }
    }
  }

  return input as InputObject;
}

function transformInputToVerifyOnChainBytecodeTaskArguments(
  input: InputObject
): VerifyOnChainBytecodeTaskArguments[] {
  // Impl Contract
  const taskArgsImpl: VerifyOnChainBytecodeTaskArguments = {
    contractName: "FiatTokenV2_2",
    contractAddress: input.FiatTokenV2_2.contractAddress,
    libraryName: "SignatureChecker",
    libraryAddress: input.SignatureChecker.contractAddress,
    isLibrary: false,
    verificationType:
      input.FiatTokenV2_2.verificationType || BytecodeVerificationType.Partial,
    metadataFilePath:
      input.FiatTokenV2_2.verificationType === BytecodeVerificationType.Full
        ? undefined
        : "verification_artifacts/FiatTokenV2_2.json",
    contractCreationTxHash: input.FiatTokenV2_2.contractCreationTxHash,
    useTracesForCreationBytecode:
      input.FiatTokenV2_2.useTracesForCreationBytecode,
    artifactType: input.FiatTokenV2_2.artifactType,
    optimizerRuns: input.FiatTokenV2_2.optimizerRuns,
  };

  // Proxy
  const taskArgsProxy: VerifyOnChainBytecodeTaskArguments = {
    contractName: "FiatTokenProxy",
    contractAddress: input.FiatTokenProxy.contractAddress,
    isLibrary: false,
    verificationType:
      input.FiatTokenProxy.verificationType || BytecodeVerificationType.Partial,
    metadataFilePath:
      input.FiatTokenProxy.verificationType === BytecodeVerificationType.Full
        ? undefined
        : "verification_artifacts/FiatTokenProxy.json",
    contractCreationTxHash: input.FiatTokenProxy.contractCreationTxHash,
    useTracesForCreationBytecode:
      input.FiatTokenProxy.useTracesForCreationBytecode,
    artifactType: input.FiatTokenProxy.artifactType,
    optimizerRuns: input.FiatTokenProxy.optimizerRuns,
  };

  // Signature Checker
  const taskArgsLib: VerifyOnChainBytecodeTaskArguments = {
    contractName: "SignatureChecker",
    contractAddress: input.SignatureChecker.contractAddress,
    isLibrary: true,
    verificationType:
      input.SignatureChecker.verificationType ||
      BytecodeVerificationType.Partial,
    metadataFilePath:
      input.SignatureChecker.verificationType === BytecodeVerificationType.Full
        ? undefined
        : "verification_artifacts/SignatureChecker.json",
    contractCreationTxHash: input.SignatureChecker.contractCreationTxHash,
    useTracesForCreationBytecode:
      input.SignatureChecker.useTracesForCreationBytecode,
    artifactType: input.SignatureChecker.artifactType,
    optimizerRuns: input.SignatureChecker.optimizerRuns,
  };

  return [taskArgsImpl, taskArgsProxy, taskArgsLib];
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
