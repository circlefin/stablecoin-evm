// SPDX-License-Identifier: MIT
//
// Copyright (c) 2018-2023 CENTRE SECZ
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

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
