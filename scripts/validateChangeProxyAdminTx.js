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

const Web3 = require("web3");
const minimist = require("minimist");
const BN = require("bn.js");
const { assert } = require("chai");
const { rlp } = require("ethereumjs-util");
const { defaultAbiCoder, Interface } = require("@ethersproject/abi");

const {
  abi: FiatTokenProxyAbi,
} = require("../build/contracts/FiatTokenProxy.json");

/**
 * A utility script to validate that the signed `changeAdmin` transaction assigns proxy admin to the v2_2UpgraderAddress.
 * @param {string} rpcUrl url to a valid JSON RPC node
 * @param {string} proxyAddress the contract address of FiatTokenProxy
 * @param {string} v2_2UpgraderAddress the contract address of V2_2Upgrader
 * @param {string} signedTx the signed transaction to be validated
 */
async function validateChangeAdminTx(
  rpcUrl,
  proxyAddress,
  v2_2UpgraderAddress,
  signedTx
) {
  const web3 = new Web3(rpcUrl);
  const proxy = new web3.eth.Contract(FiatTokenProxyAbi, proxyAddress);
  const proxyAdmin = await proxy.methods.admin().call();

  console.log(">> Validating signed tx sender matches proxyAdmin address...");

  const { nonce, to, value, data } = decodeTx(signedTx);
  const decodedFnData = decodeTxData("changeAdmin(address)", data);
  const { newAdmin } = decodedFnData;

  const expectedNonce = await web3.eth.getTransactionCount(proxyAdmin);
  assert(
    nonce === expectedNonce,
    `Nonce does not match admin key nonce: Expected '${expectedNonce}' but was '${nonce}'`
  );

  assert(
    web3.utils.toChecksumAddress(to) ===
      web3.utils.toChecksumAddress(proxyAddress),
    `'To' value does not match input proxy contract address: Expected '${proxyAddress}' but was '${to}'`
  );

  assert(value === 0, "Value does does not equal zero");

  assert(
    web3.utils.toChecksumAddress(newAdmin) ===
      web3.utils.toChecksumAddress(v2_2UpgraderAddress),
    `Upgrader contract does not match input upgrader contract address: Expected '${v2_2UpgraderAddress}' but was '${newAdmin}'`
  );

  console.log(">> Decoded parameters: \n", {
    nonce,
    to,
    value,
    data: {
      newAdmin,
    },
  });

  console.log(">> Signed tx verified!");
}

function decodeTx(signedTx) {
  const [
    rawNonce,
    rawGasPrice,
    rawGasLimit,
    rawTo,
    rawValue,
    rawData,
    rawV,
    rawR,
    rawS,
  ] = rlp.decode(signedTx);

  return {
    nonce: new BN(rawNonce).toNumber(),
    gasPrice: new BN(rawGasPrice).toNumber(),
    gasLimit: new BN(rawGasLimit).toNumber(),
    to: "0x" + Buffer.from(rawTo).toString("hex"),
    value: new BN(rawValue).toNumber(),
    data: "0x" + Buffer.from(rawData).toString("hex"),
    v: new BN(rawV).toNumber(),
    r: "0x" + Buffer.from(rawR).toString("hex"),
    s: "0x" + Buffer.from(rawS).toString("hex"),
  };
}

function decodeTxData(fnName, data) {
  const iface = new Interface(FiatTokenProxyAbi);
  const params = "0x" + data.substring(10); // Remove function selector from data hex
  const fnInfo = iface.functions[fnName];
  return defaultAbiCoder.decode(fnInfo.inputs, params);
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ["proxy-address", "upgrader-address", "signed-tx"],
  });

  const proxyAddress = argv["proxy-address"];
  const v2_2UpgraderAddress = argv["upgrader-address"];
  const rpcUrl = argv["rpc-url"];
  const signedTx = argv["signed-tx"];

  if (
    !proxyAddress ||
    !v2_2UpgraderAddress ||
    !rpcUrl ||
    !signedTx ||
    !Web3.utils.isAddress(proxyAddress) ||
    !Web3.utils.isAddress(v2_2UpgraderAddress)
  ) {
    throw new Error(
      /* eslint-disable no-multi-str */
      "Usage: yarn execScript scripts/validateChangeProxyAdminTx.js \n\
      --proxy-address=<Proxy contract address> \n\
      --upgrader-address=<V2.2 Upgrader contract address> \n\
      --rpc-url=<URL to a valid RPC> \n\
      --signed-tx=<Signed changeAdmin transaction bytes>"
    );
  }

  console.log(`proxyAddress: ${proxyAddress}`);
  console.log(`v2_2UpgraderAddress: ${v2_2UpgraderAddress}`);
  console.log(`rpcUrl: ${rpcUrl}`);
  console.log(`signedTx: ${"*".repeat(signedTx.length)}`);

  await validateChangeAdminTx(
    rpcUrl,
    proxyAddress,
    v2_2UpgraderAddress,
    signedTx
  );
}

module.exports = main;
module.exports.validateChangeAdminTx = validateChangeAdminTx;
