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
 */

const BN = require("bn.js");
const { assert } = require("chai");
const { rlp } = require("ethereumjs-util");
const { defaultAbiCoder, Interface } = require("@ethersproject/abi");

const {
  abi: FiatTokenProxyAbi,
} = require("../build/contracts/FiatTokenProxy.json");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

/**
 * A utility script to validate that the signed `changeAdmin` transaction assigns proxy admin to the v2_2UpgraderAddress.
 * @param {string} proxyAddress the contract address of FiatTokenProxy
 * @param {string} v2_2UpgraderAddress the contract address of V2_2Upgrader
 * @param {string} signedTx the signed transaction to be validated
 */
async function validateChangeAdminTx(
  proxyAddress,
  v2_2UpgraderAddress,
  signedTx
) {
  const proxy = await FiatTokenProxy.at(proxyAddress);
  const proxyAdmin = await proxy.admin();

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

async function main(callback) {
  /* eslint-disable no-undef -- Config is a global variable in a truffle exec script https://github.com/trufflesuite/truffle/pull/3233 */
  const network = config.network;
  const rawProxyAddress = config.proxyAddress;
  const rawUpgraderAddress = config.upgraderAddress;
  const rawSignedTx = config.signedTx;

  /* eslint-enable no-undef */
  const usageError = new Error(
    /* eslint-disable no-multi-str */
    "Usage: yarn truffle exec scripts/validateChangeProxyAdminTx.js \
    [--network=<NETWORK>] \
    [--proxy-address=<0x-stripped Proxy contract address>] \
    [--upgrader-address=<0x-stripped V2.2 Upgrader contract address>] \
    --signed-tx=<0x-stripped Signed changeAdmin transaction>"
  );

  const proxyAddress =
    network === "development" && !rawProxyAddress
      ? (await FiatTokenProxy.deployed()).address
      : `0x${rawProxyAddress}`;
  const v2_2UpgraderAddress =
    network === "development" && !rawUpgraderAddress
      ? (await V2_2Upgrader.deployed()).address
      : `0x${rawUpgraderAddress}`;
  const signedTx = `0x${rawSignedTx}`;

  console.log(`network: ${network}`);
  console.log(`proxyAddress: ${proxyAddress}`);
  console.log(`v2_2UpgraderAddress: ${v2_2UpgraderAddress}`);
  console.log(`signedTx: ${"*".repeat(signedTx.length)}`);

  if (
    !web3.utils.isAddress(proxyAddress) ||
    !web3.utils.isAddress(v2_2UpgraderAddress)
  ) {
    callback(usageError);
  } else {
    try {
      await validateChangeAdminTx(proxyAddress, v2_2UpgraderAddress, signedTx);
      callback();
    } catch (e) {
      callback(e);
    }
  }
}

module.exports = main;
module.exports.validateChangeAdminTx = validateChangeAdminTx;
