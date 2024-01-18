/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2023, Circle Internet Financial, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A utility script to validate that the locally compiled bytecode matches deployed bytecode on chain.
 * @param {string} contractName         name of the contract to validate
 * @param {string} contractAddress      address of the contract to validate
 * @param {string} libraryName          name of a library contract the main contract uses
 * @param {string} libraryAddress       address of the library contract
 * @param {string} verificationType     full/partial verification
 */
async function validateBytecodeOnChain(
  contractName,
  contractAddress,
  libraryName,
  libraryAddress,
  verificationType
) {
  // Getting contract bytecode from blockchain
  const rawOnchainBytecode = await web3.eth.getCode(contractAddress);

  // Getting locally compiled bytecode, swap out library contract addresses
  let {
    deployedBytecode: rawLocalBytecode,
  } = require(`../build/contracts/${contractName}.json`);
  if (libraryName) {
    const paddedLibraryName = libraryName.padEnd(38, "_").padStart(40, "_");
    rawLocalBytecode = rawLocalBytecode.replaceAll(
      paddedLibraryName,
      libraryAddress.slice(2).toLowerCase()
    );
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

function logBytecodeComparisonResult(bytecodeA, bytecodeB, verificationType) {
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

function removeMetadataHash(contractBytecode) {
  const metadataLength = getContractMetadataLength(contractBytecode);
  return contractBytecode.slice(0, contractBytecode.length - metadataLength);
}

function getContractMetadataLength(contractBytecode) {
  // Read the last two bytes to determine the length of the CBOR encoding
  // https://docs.soliditylang.org/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
  const metadataLengthHex = contractBytecode.slice(
    contractBytecode.length - 4,
    contractBytecode.length
  );

  const metadataNumBytes = parseInt(metadataLengthHex, 16);
  return metadataNumBytes * 2 + metadataLengthHex.length;
}

module.exports = async function main(callback) {
  /* eslint-disable no-undef -- Config is a global variable in a truffle exec script https://github.com/trufflesuite/truffle/pull/3233 */
  const network = config.network;
  const contractName = config.contractName;
  const rawContractAddress = config.contractAddress;
  const libraryName = config.libraryName;
  const rawLibraryAddress = config.libraryAddress;
  const verificationType = config.verificationType;

  const usageError = new Error(
    /* eslint-disable no-multi-str */
    "Usage: yarn compile --all && yarn truffle exec scripts/validateBytecodeOnChain.js \
    [--network=<NETWORK>] \
    [--library-name=<Name of the library contract>] \
    [--library-address=<0x-stripped library contract address>] \
    --contract-name=<Name of the contract to validate> \
    --contract-address=<0x-stripped contract address> \
    --verification-type=<full/partial>"
  );

  const contractAddress = `0x${rawContractAddress}`;
  const libraryAddress = `0x${rawLibraryAddress}`;

  console.log(`network: ${network}`);
  console.log(`contractName: ${contractName}`);
  console.log(`contractAddress: ${contractAddress}`);
  console.log(`libraryName: ${libraryName}`);
  console.log(`libraryAddress: ${libraryAddress}`);
  console.log(`verificationType: ${verificationType}`);

  if (
    !web3.utils.isAddress(contractAddress) ||
    !contractName ||
    (libraryName && !web3.utils.isAddress(libraryAddress)) ||
    (verificationType !== "partial" && verificationType !== "full")
  ) {
    callback(usageError);
  } else {
    try {
      await validateBytecodeOnChain(
        contractName,
        contractAddress,
        libraryName,
        libraryAddress,
        verificationType
      );
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
