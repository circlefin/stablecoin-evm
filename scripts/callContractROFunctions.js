/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2023 CENTRE SECZ
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

const _ = require("lodash");

/**
 * A utility script that calls a series of read-only functions with no inputs
 * on a contract, and prints the results to console.
 * @param {string} contractName The name of the contract. Eg. FiatTokenV2_1
 * @param {string} contractAddress The address of the contract
 * @param {string[]} functionNames An array of read-only function names to be called.
 */
async function main(contractName, contractAddress, functionNames) {
  let Contract;
  try {
    Contract = require(`../build/contracts/${contractName}.json`);
  } catch (e) {
    throw new Error(
      `Cannot find abi '${contractName}'! Run \`yarn compile\` to generate the abi first!`
    );
  }

  if ((await web3.eth.getCode(contractAddress)).length <= 2) {
    throw new Error(`Cannot find contract at address '${contractAddress}'!`);
  }

  const viewFunctionResults = await Promise.all(
    functionNames.map((funcName) =>
      conditionalCallROFunction(Contract, contractAddress, funcName)
    )
  );

  const result = _.fromPairs(
    _.zip(functionNames, viewFunctionResults),
    (element) => element[0]
  );
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Memory addresses for the return data of certain read-only functions
 * on the FiatTokenProxy contract.
 */
const FiatTokenProxy_SLOT_ADDRESSES = {
  admin: "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b",
  implementation:
    "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3",
};

/**
 * Conditionally calls a read-only function from a contract, depending on the contractName.
 *
 * If the contract is FiatTokenProxy, and either `name()` or `implementation()` is requested,
 * then first try to get the result by calling the function, reading from storage slots as a fallback
 * since these functions return data from static memory addresses.
 *
 * Otherwise, get the result by calling the function.
 * @param {object} Contract The JSON abi for the contract
 * @param {string} contractAddress The address of the contract.
 * @param {string} funcName The read-only function to be called.
 * @returns The result from calling the function.
 */
async function conditionalCallROFunction(Contract, contractAddress, funcName) {
  const contract = new web3.eth.Contract(Contract.abi, contractAddress);

  if (!contract.methods[funcName]) {
    throw new Error(`Cannot find ${funcName} in contract!`);
  }

  if (
    Contract.contractName === "FiatTokenProxy" &&
    ["admin", "implementation"].includes(funcName)
  ) {
    try {
      return await contract.methods[funcName]().call();
    } catch {
      const storageResult = await web3.eth.getStorageAt(
        contractAddress,
        FiatTokenProxy_SLOT_ADDRESSES[funcName]
      );
      return web3.utils.toChecksumAddress("0x" + storageResult.slice(26));
    }
  }

  return await contract.methods[funcName]().call();
}

module.exports = async (callback) => {
  /* eslint-disable no-undef -- Config is a global variable in a truffle exec script https://github.com/trufflesuite/truffle/pull/3233 */
  const network = config.network;
  const argv = config._;

  const contractName = config.contractName;
  const rawContractAddress = config.contractAddress;
  const functionNames = argv.slice(1);
  /* eslint-enable no-undef */

  const usageError = new Error(
    "Usage: yarn truffle exec scripts/callContractROFunctions.js [--network=<NETWORK>] \n" +
      "--contract-name=<contract name eg. FiatTokenV2_1>\n" +
      "--contract-address=<0x-stripped address>\n" +
      "[functionNames...]"
  );

  const contractAddress = `0x${rawContractAddress}`;

  console.log(`network: ${network}`);
  console.log(`contractName: ${contractName}`);
  console.log(`contractAddress: ${contractAddress}`);
  console.log(`functionNames: ${functionNames}`);

  if (!web3.utils.isAddress(contractAddress)) {
    callback(usageError);
  } else {
    try {
      await main(contractName, contractAddress, functionNames);
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
