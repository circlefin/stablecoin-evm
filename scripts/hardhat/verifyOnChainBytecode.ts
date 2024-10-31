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

import bs58 from "bs58";
import { decode } from "cbor";
import { readFileSync } from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, LinkReferences } from "hardhat/types";
import Hash from "ipfs-only-hash";
import _ from "lodash";
import path from "path";
import { hardhatArgumentTypes } from "./hardhatArgumentTypes";
import { alternativeArtifacts, ArtifactType } from "./alternativeArtifacts";
import { execSyncWrapper, validateOptimizerRuns } from "./helpers";

export type TaskArguments = {
  contractName: string;
  contractAddress: string;
  libraryName?: string;
  libraryAddress?: string;
  verificationType: BytecodeVerificationType;
  onchainBytecodeFilePath?: string;
  isLibrary?: boolean;
  metadataFilePath?: string;
  contractCreationTxHash?: string;
  useTracesForCreationBytecode?: boolean;
  artifactType?: ArtifactType;
  optimizerRuns?: number;
};

export enum BytecodeVerificationType {
  Partial = "partial", // verifies the runtime bytecode without checking the metadata hash
  Full = "full", // verifies the entire runtime bytecode including the metadata hash
}

export enum BytecodeInputType {
  ConstructorCode = "constructor code", // Constructor bytecode (the portion that preceeds the runtime bytecode within the full creation bytecode)
  RuntimeBytecodeFull = "full runtime bytecode", // Runtime bytecode including metadata hash
  RuntimeBytecodePartial = "partial runtime bytecode", // Runtime bytecode excluding metadata hash
  MetadataHash = "metadata hash",
}

export interface ContractArtifact {
  creationBytecode: string;
  runtimeBytecode: string;
  creationLinkReferences: LinkReferences;
  runtimeLinkReferences: LinkReferences;
}

interface GethTransactionTrace {
  from: string;
  to: string;
  gas: string;
  gasUsed: string;
  input: string;
  output?: string;
  type: string;
  value?: string;
  calls?: GethTransactionTrace[];
}

type BytecodeComparisonResult = {
  type: BytecodeInputType;
  equal: boolean; // if the inputs are identical
};

task(
  "verifyOnChainBytecode",
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
    "partial",
    hardhatArgumentTypes.oneOf(["full", "partial"])
  )
  .addOptionalParam(
    "onchainBytecodeFilePath",
    "Local file path that contains the deployed bytecode on chain. You can retrieve this using the eth_getCode RPC or from the 'Deployed Bytecode' section on Etherscan.",
    undefined,
    hardhatArgumentTypes.string
  )
  .addOptionalParam(
    "isLibrary",
    "If the contract being verified is a library contract",
    false,
    hardhatArgumentTypes.boolean
  )
  .addOptionalParam(
    "metadataFilePath",
    "Local file path that contains the uploaded metadata",
    undefined,
    hardhatArgumentTypes.string
  )
  .addOptionalParam(
    "contractCreationTxHash",
    "Transaction hash of the contract creation transaction",
    undefined,
    hardhatArgumentTypes.string
  )
  .addOptionalParam(
    "useTracesForCreationBytecode",
    "Use transaction traces to pull the contract creation bytecode",
    false,
    hardhatArgumentTypes.boolean
  )
  .addOptionalParam(
    "artifactType",
    "The type of artifact to use for verification",
    undefined,
    hardhatArgumentTypes.string
  )
  .addOptionalParam(
    "optimizerRuns",
    "The optimizer runs to use to compile the contract",
    undefined,
    hardhatArgumentTypes.int
  )
  .setAction(taskAction);

/**
 * Wrapper function to pretty print the results of `verifyOnChainBytecode`.
 */
async function taskAction(
  taskArguments: TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const results = await verifyOnChainBytecode(taskArguments, hre);
  logBytecodeComparisonResults(results);
}

/**
 * A utility script to verify contract bytecode against locally compiled bytecode.
 *
 * Anatomy of contract bytecode:
 * contract_creation_code = <constructor_code><runtime_bytecode><constructor_arguments>
 * runtime_bytecode = <runtime_logic_bytecode><metadata_hash><metadata_len(2 byte at end)>
 *
 * Edge cases:
 * 1) With solc v6 and v7, there's an anomoly where constants(strings) used by the constructor is added between `runtime_bytecode` and `constructor_arguments`
 * 2) Runtime bytecode of contracts using external libraries has the address of the external library embedded
 * 3) Runtime bytecode of library contracts has its own address embedded after the first PUSH instruction
 */
export async function verifyOnChainBytecode(
  {
    contractName,
    contractAddress,
    libraryName,
    libraryAddress,
    verificationType,
    onchainBytecodeFilePath,
    isLibrary,
    metadataFilePath,
    contractCreationTxHash,
    useTracesForCreationBytecode,
    artifactType,
    optimizerRuns,
  }: TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<BytecodeComparisonResult[]> {
  if (optimizerRuns) {
    validateOptimizerRuns(optimizerRuns);
    execSyncWrapper(`forge build --optimizer-runs ${optimizerRuns}`);
  }
  const bytecodeComparisonResults = [];

  // Getting contract bytecode from blockchain or local file input
  let actualRuntimeBytecode;
  if (onchainBytecodeFilePath) {
    actualRuntimeBytecode = readFileSync(
      path.join(__dirname, "..", "..", onchainBytecodeFilePath),
      "utf-8"
    );
  } else {
    actualRuntimeBytecode = await hre.ethers.provider.getCode(contractAddress);
  }

  const contractArtifact = getContractArtifact(contractName, artifactType);
  const expectedCreationBytecode = contractArtifact.creationBytecode;
  let expectedRuntimeBytecode = contractArtifact.runtimeBytecode;
  const creationLinkReferences = contractArtifact.creationLinkReferences;
  const runtimeLinkReferences = contractArtifact.runtimeLinkReferences;

  // ==== Compare constructor code between contract on chain and locally compiled version
  if (contractCreationTxHash) {
    const actualCreationBytecode = await getContractCreationBytecode(
      hre,
      contractAddress,
      contractCreationTxHash,
      useTracesForCreationBytecode
    );
    const constructorCodeEndIndex = getConstructorCodeEndIndex(
      expectedCreationBytecode,
      expectedRuntimeBytecode,
      libraryName,
      creationLinkReferences,
      runtimeLinkReferences
    );

    bytecodeComparisonResults.push({
      type: BytecodeInputType.ConstructorCode,
      equal:
        // actual bytecode on chain
        actualCreationBytecode.slice(0, constructorCodeEndIndex) ===
        // expected bytecode from local compilation
        expectedCreationBytecode.slice(0, constructorCodeEndIndex),
    });
  }

  // ==== Replace embedded address in library contracts
  // Library contract bytecode changes at deploy time. The contract address is embedded after the first push instruction
  // https://docs.soliditylang.org/en/develop/contracts.html#call-protection-for-libraries
  if (isLibrary) {
    // Replace bytecode (4, 44) with contract address
    const firstInstructionLength = 4;
    expectedRuntimeBytecode =
      expectedRuntimeBytecode.slice(0, firstInstructionLength) +
      contractAddress.toLowerCase().slice(2) +
      expectedRuntimeBytecode.slice(
        firstInstructionLength + contractAddress.slice(2).length
      );
  }

  // ==== For contracts that use external libraries, replace embedded library address with locally compiled bytecode with actual library addresses from user input.
  if (libraryName && libraryAddress) {
    const libraryReferencePositions: {
      length: number;
      start: number;
    }[] = _.chain(runtimeLinkReferences)
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
      expectedRuntimeBytecode =
        expectedRuntimeBytecode.slice(0, 2 + position.start * 2) +
        replacement +
        expectedRuntimeBytecode.slice(
          2 + position.start * 2 + position["length"] * 2
        );
    }
  }

  // ==== Compare runtime bytecode
  if (verificationType === BytecodeVerificationType.Full) {
    bytecodeComparisonResults.push({
      type: BytecodeInputType.RuntimeBytecodeFull,
      equal: expectedRuntimeBytecode === actualRuntimeBytecode,
    });
  } else {
    bytecodeComparisonResults.push({
      type: BytecodeInputType.RuntimeBytecodePartial,
      equal:
        removeMetadataHashAndMetadataLen(actualRuntimeBytecode) ===
        removeMetadataHashAndMetadataLen(expectedRuntimeBytecode),
    });
  }

  // ==== Compare user-supplied metadata file against metadata hash in deployed bytecode
  if (metadataFilePath) {
    const rawMetadata = readFileSync(
      path.join(__dirname, "..", "..", metadataFilePath),
      "utf-8"
    );
    const metadataHash = await Hash.of(rawMetadata); // the library output is bs58 encoded by default
    const expectedMetadataHash = Buffer.from(
      bs58.decode(metadataHash)
    ).toString("hex");

    const actualMetadataHash = getCborDecodedIpfsHash(actualRuntimeBytecode);

    bytecodeComparisonResults.push({
      type: BytecodeInputType.MetadataHash,
      equal: expectedMetadataHash === actualMetadataHash,
    });
  }

  return bytecodeComparisonResults;
}

export function logBytecodeComparisonResults(
  results: BytecodeComparisonResult[]
): void {
  for (const { type, equal } of results) {
    if (!equal) {
      console.warn(
        "\x1b[31m",
        `\nWARNING: verification failed - ${type} mismatch.`
      );
    } else {
      console.log(
        "\x1b[32m",
        `\nverification complete - supplied ${type} is consistent with local version.`
      );
    }
  }
}

/**
 * Returns contract creation bytecode
 */
async function getContractCreationBytecode(
  hre: HardhatRuntimeEnvironment,
  contractAddress: string,
  contractCreationTxHash: string,
  useTracesForCreationBytecode: boolean | undefined
): Promise<string> {
  if (useTracesForCreationBytecode) {
    const transactionTraces: GethTransactionTrace = await hre.ethers.provider.send(
      "debug_traceTransaction",
      [contractCreationTxHash, { tracer: "callTracer" }]
    );
    return extractBytecodeFromGethTraces(transactionTraces, contractAddress);
  }
  const transaction = await hre.ethers.provider.getTransaction(
    contractCreationTxHash
  );
  if (transaction == null) {
    throw new Error("Transaction not found");
  }
  return transaction.data;
}

/**
 * Returns contract creation bytecode given traces
 */
export function extractBytecodeFromGethTraces(
  traces: GethTransactionTrace,
  targetContract: string
): string {
  if (
    traces.to.toLowerCase() === targetContract.toLowerCase() &&
    (traces.type === "CREATE" || traces.type === "CREATE2")
  ) {
    return traces.input;
  }
  if (traces.calls) {
    for (const call of traces.calls) {
      return extractBytecodeFromGethTraces(call, targetContract);
    }
  }
  throw new Error("Contract creation trace not found");
}

/**
 * Returns contract artifact
 */
function getContractArtifact(
  contractName: string,
  artifactType: ArtifactType | undefined
): ContractArtifact {
  if (artifactType !== undefined) {
    return getAlternativeArtifact(contractName, artifactType);
  }
  // Getting locally compiled bytecode
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

  return {
    creationBytecode: foundryContractArtifact.bytecode.object,
    runtimeBytecode: foundryContractArtifact.deployedBytecode.object,
    creationLinkReferences: foundryContractArtifact.bytecode.linkReferences,
    runtimeLinkReferences:
      foundryContractArtifact.deployedBytecode.linkReferences,
  };
}

/**
 * Returns contract artifact from the static alternative artifacts
 */
function getAlternativeArtifact(
  contractName: string,
  artifactType: ArtifactType
): ContractArtifact {
  if (!Object.values(ArtifactType).includes(artifactType)) {
    throw new Error(`artifact type ${artifactType} not supported`);
  }
  const alternativeArtifactContracts = alternativeArtifacts.get(
    artifactType as ArtifactType
  );
  if (alternativeArtifactContracts === undefined) {
    throw new Error(`artifacts not found for artifact type ${artifactType}`);
  }
  const contractArtifact = alternativeArtifactContracts.get(contractName);
  if (contractArtifact === undefined) {
    throw new Error(
      `artifact not found for contract ${contractName} for artifact type ${artifactType}`
    );
  }

  return contractArtifact;
}

/**
 * Strips the metadata hash bytes from a contract's runtime bytecode. The hash is cbor-encoded and must
 * be decoded to reveal the ipfs hash stored in the object.
 *
 * NOTE: This function only works for bytecode that are generated with "settings.metadata.bytecodeHash"
 * set to default of "ipfs".
 * @see {@link https://docs.soliditylang.org/en/latest/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode}
 * for information about the metadata hash.
 */
function getCborDecodedIpfsHash(runtimeBytecode: string): string {
  const metadataLength = getContractMetadataLength(runtimeBytecode);
  const cborBytes = runtimeBytecode.slice(
    runtimeBytecode.length - metadataLength,
    runtimeBytecode.length - 4
  );
  const decodedCborBytes = decode(Buffer.from(cborBytes, "hex"));
  if (!decodedCborBytes.ipfs) {
    throw new Error(
      "IPFS hash not detected. Metadata uploaded via alternative methods."
    );
  }
  return decodedCborBytes.ipfs.toString("hex");
}

/**
 * Returns contract runtime bytecode after the metadata hash has been stripped.
 */
function removeMetadataHashAndMetadataLen(runtimeBytecode: string): string {
  const metadataLength = getContractMetadataLength(runtimeBytecode);
  return runtimeBytecode.slice(0, runtimeBytecode.length - metadataLength);
}

/**
 * Read last 4 digits of the contract runtime bytecode to determine the full length of the metadata hash
 */
function getContractMetadataLength(runtimeBytecode: string): number {
  // Read the last two bytes to determine the length of the CBOR encoding
  // https://docs.soliditylang.org/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
  const metadataLengthHex = runtimeBytecode.slice(
    runtimeBytecode.length - 4,
    runtimeBytecode.length
  );

  const metadataNumBytes = parseInt(metadataLengthHex, 16);
  return metadataNumBytes * 2 + metadataLengthHex.length;
}

/**
 * Retrieves the index in the creation bytecode that partitions the constructor_code
 * from the rest of the creation bytecode
 *
 * @returns {number} The last index in the creation bytecode that describes the constructor_code
 */
function getConstructorCodeEndIndex(
  creationBytecode: string,
  runtimeBytecode: string,
  libraryName: string | undefined,
  creationLinkReferences: LinkReferences,
  runtimeLinkReferences: LinkReferences
): number {
  let constructorCodeEndIndex = -1;

  if (!libraryName) {
    // If the contract does not use external library contracts, the runtime bytecode should be a part of
    // the contract creation code
    constructorCodeEndIndex = creationBytecode.indexOf(
      removeMetadataHashAndMetadataLen(runtimeBytecode).slice(2) // Remove "0x" at the beginning and metadata hash at end
    );
  } else {
    // If the contract does reference a library contract, we can use the 1st library position as an anchor
    // in the creation and runtime bytecode to align them. By shifting the cursor on the creation bytecode
    // forward by length of the 1st library position, we should get the last index of the constructor code.
    const getFirstLibStart = (linkReferences: LinkReferences): number => {
      if (!linkReferences) {
        throw new Error("Library link reference object is empty.");
      }
      const values = Object.values(linkReferences)[0];
      const libRefs = values[libraryName];
      if (!libRefs || !libRefs.length) {
        throw new Error(`References to ${libraryName} library not found.`);
      }
      const startIndices: number[] = libRefs.map((a) => a.start);
      return Math.min(...startIndices);
    };
    constructorCodeEndIndex =
      (getFirstLibStart(creationLinkReferences) -
        getFirstLibStart(runtimeLinkReferences)) *
      2;
  }
  return constructorCodeEndIndex;
}
