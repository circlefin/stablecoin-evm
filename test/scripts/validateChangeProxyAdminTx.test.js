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

const { Transaction } = require("ethereumjs-tx");
const { encodeAddress } = require("../v1/helpers/abi");
const {
  validateChangeAdminTx,
} = require("../../scripts/validateChangeProxyAdminTx.js");
const { Accounts, AccountPrivateKeys } = require("../minting/AccountUtils");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

contract("Test script to validate change proxy admin transaction", () => {
  let proxyAddress,
    proxyAdminAddress,
    proxyAdminPrivateKey,
    upgraderContractAddress,
    arbitraryAccount;

  const LOCAL_RPC_URL = "http://localhost:8545";

  before(async () => {
    const proxy = await FiatTokenProxy.deployed();
    proxyAddress = proxy.address;
    proxyAdminAddress = Accounts.proxyOwnerAccount;
    arbitraryAccount = Accounts.arbitraryAccount;
    proxyAdminPrivateKey = "0x" + AccountPrivateKeys.proxyOwnerAccount;
    upgraderContractAddress = (await V2_2Upgrader.deployed()).address;
  });

  it("succeeds after validating a valid signed transaction", async () => {
    const signedTx = await generateSignedTx(
      proxyAddress,
      proxyAdminAddress,
      proxyAdminPrivateKey,
      upgraderContractAddress
    );
    await validateChangeAdminTx(
      LOCAL_RPC_URL,
      proxyAddress,
      upgraderContractAddress,
      signedTx
    );
  });

  it("throws if signed tx assigns proxy admin to unexpected address", async () => {
    const signedTx = await generateSignedTx(
      proxyAddress,
      proxyAdminAddress,
      proxyAdminPrivateKey,
      arbitraryAccount
    );

    try {
      await validateChangeAdminTx(
        LOCAL_RPC_URL,
        proxyAddress,
        upgraderContractAddress,
        signedTx
      );
    } catch (e) {
      assert(
        e.message.startsWith(
          "Upgrader contract does not match input upgrader contract address"
        )
      );
    }
  });
});

async function generateSignedTx(
  proxyAddress,
  proxyAdminAddress,
  proxyAdminPrivateKey,
  upgraderContractAddress
) {
  const tx = new Transaction({
    nonce: web3.utils.toHex(
      await web3.eth.getTransactionCount(proxyAdminAddress)
    ),
    to: proxyAddress,
    value: 0,
    data:
      web3.utils.keccak256("changeAdmin(address)").slice(0, 10) +
      encodeAddress(upgraderContractAddress),
  });

  const privateKey = Buffer.from(proxyAdminPrivateKey.slice(2), "hex");
  tx.sign(privateKey);
  return "0x" + tx.serialize().toString("hex");
}
