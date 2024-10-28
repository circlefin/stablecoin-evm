/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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

async function makeRawTransaction(
  data,
  fromAddress,
  fromAddressPrivateKey,
  toAddress,
  gasLimit = 1000000
) {
  const wallet = web3.eth.accounts.wallet.add({
    privateKey: fromAddressPrivateKey,
    address: fromAddress,
  });
  const { rawTransaction } = await wallet.signTransaction({
    from: fromAddress,
    to: toAddress,
    gas: gasLimit,
    gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
    value: 0,
    data,
    chainId: await web3.eth.getChainId(),
  });
  return rawTransaction;
}

function sendRawTransaction(raw) {
  return web3.eth.sendSignedTransaction(raw);
}

function functionSignature(methodName) {
  return web3.utils.keccak256(methodName).slice(0, 10);
}

function encodeAddress(address) {
  address = address.substr(2, address.length - 2);
  while (address.length < 64) address = "0" + address;
  return address;
}

function encodeUint(value) {
  value = value.toString(16);
  while (value.length < 64) value = "0" + value;
  return value;
}

// Create ABI calls for functions
function msgData0(methodName, value) {
  return functionSignature(methodName) + encodeUint(value);
}

function msgData(methodName, addressValue) {
  return functionSignature(methodName) + encodeAddress(addressValue);
}

function msgData1(methodName, address, value) {
  return (
    functionSignature(methodName) + encodeAddress(address) + encodeUint(value)
  );
}

function msgData2(methodName, address1, address2, value) {
  return (
    functionSignature(methodName) +
    encodeAddress(address1) +
    encodeAddress(address2) +
    encodeUint(value)
  );
}

function msgData3(methodName, address1, value1, address2, value2) {
  return (
    functionSignature(methodName) +
    encodeAddress(address1) +
    encodeUint(value1) +
    encodeAddress(address2) +
    encodeUint(value2)
  );
}

module.exports = {
  makeRawTransaction,
  sendRawTransaction,
  functionSignature,
  encodeAddress,
  encodeUint,
  msgData0,
  msgData,
  msgData1,
  msgData2,
  msgData3,
};
