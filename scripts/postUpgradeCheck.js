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

const BN = require("bn.js");
const crypto = require("crypto");
const { assert } = require("chai");
const { createAccount } = require("./createAccount");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");

/**
 * A utility script to streamline testing immediately after a fiat token upgrade.
 * @param {*} value               Amount of fiat token used for each transaction.
 * @param {*} proxyAddress        Address of deployed FiatTokenProxy
 * @param {*} alice               Address of an existing keypair. Must be funded with native token and (4 * value) fiat token.
 * @param {*} alicePrivateKey     Private key of the existing keypair
 * @param {*} aliceWallet         Optional: Address of ERC1271 wallet owned by Alice
 * @param {*} bob                 Optional: Address of a third keypair. Does not require funding
 * @param {*} bobPrivateKey       Optional: Private key of a third keypair.
 * @param {*} charlie             Address of a second keypair. Must be funded with native token.
 * @param {*} shouldTestBlacklist Whether or not to perform blacklist and unblacklist checks.
 * @param {*} from                Index of the first check to perform
 * @param {*} to                  Optional: Index of the last check to perform
 */
async function postUpgradeCheck(
  value,
  proxyAddress,
  alice,
  alicePrivateKey,
  aliceWallet,
  bob,
  bobPrivateKey,
  charlie,
  shouldTestBlacklist,
  from,
  to
) {
  // Importing helpers during script execution.
  // This is a workaround to allow global instance of `web3` and `artifacts` to be exposed to helper modules.
  const {
    signCancelAuthorization,
    signPermit,
    signReceiveAuthorization,
    signTransferAuthorization,
  } = require("../test/v2/GasAbstraction/helpers");
  const { hexStringFromBuffer, packSignature } = require("../test/helpers");

  const proxyAsV22 = await FiatTokenV2_2.at(proxyAddress);
  const blacklister = await proxyAsV22.blacklister();

  const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const domainSeparator = await proxyAsV22.DOMAIN_SEPARATOR();

  console.log(`\n>>> Domain separator: ${domainSeparator}`);

  // Generate keypair for Bob
  if (!bob || !bobPrivateKey) {
    console.log("\n>>> Generating address for Bob:");
    [bob, bobPrivateKey] = await createAccount();
  }

  // Check initial balance
  console.log("Starting balance check...");
  const aliceBalance = await proxyAsV22.balanceOf(alice);
  assert(
    aliceBalance.toNumber() >= value * 4,
    "Low fiat token balance from Alice"
  );

  for (const address of [alice, charlie, blacklister]) {
    const nativeBalance = new BN(await web3.eth.getBalance(address));
    assert(
      nativeBalance.toString() !== 0,
      `Address ${address} needs to be funded with native token!`
    );
  }

  // Deploy Mock ERC1271 wallet for Alice
  if (!aliceWallet) {
    console.log(
      "Wallet not specified, starting to deploy new ERC1271 wallet..."
    );
    aliceWallet = (await MockERC1271Wallet.new(alice)).address;
    console.log(`\n>>> Generated wallet for Alice: '${aliceWallet}'`);
  }

  const step0_transfer = async () => {
    // Alice transfer 2e5 to Alice's wallet.
    return proxyAsV22.transfer.request(aliceWallet, value * 2, {
      from: alice,
    });
    // Alice fiat token balance = 2 * value
  };

  const step1_transferWithAuthEOA = async () => {
    // transferWithAuthorization() with EOA
    const transferEOANonce = hexStringFromBuffer(crypto.randomBytes(32));
    console.log("transferEOANonce: ", transferEOANonce);
    const transferEOASignature = signTransferAuthorization(
      alice,
      bob,
      value,
      validAfter,
      validBefore,
      transferEOANonce,
      domainSeparator,
      alicePrivateKey.slice(2)
    );
    console.log("transferEOASignature: ", transferEOASignature);

    return proxyAsV22.transferWithAuthorization.request(
      alice,
      bob,
      value,
      validAfter,
      validBefore,
      transferEOANonce,
      packSignature(transferEOASignature),
      { from: charlie }
    );
  };

  const step2_transferWithAuthAA = async () => {
    // transferWithAuthorization() with AA
    const transferAANonce = hexStringFromBuffer(crypto.randomBytes(32));
    console.log("transferAANonce: ", transferAANonce);
    const transferAASignature = signTransferAuthorization(
      aliceWallet,
      bob,
      value,
      validAfter,
      validBefore,
      transferAANonce,
      domainSeparator,
      alicePrivateKey.slice(2)
    );
    return proxyAsV22.transferWithAuthorization.request(
      aliceWallet,
      bob,
      value,
      validAfter,
      validBefore,
      transferAANonce,
      packSignature(transferAASignature),
      { from: charlie }
    );
    // Bob balance = value * 2
  };

  const step3_receiveWithAuthEOA = async () => {
    // receiveWithAuthorization() with EOA
    const receiveEOANonce = hexStringFromBuffer(crypto.randomBytes(32));
    console.log("receiveEOANonce: ", receiveEOANonce);
    const receiveEOASignature = signReceiveAuthorization(
      alice,
      charlie,
      value,
      validAfter,
      validBefore,
      receiveEOANonce,
      domainSeparator,
      alicePrivateKey.slice(2)
    );
    return proxyAsV22.receiveWithAuthorization.request(
      alice,
      charlie,
      value,
      validAfter,
      validBefore,
      receiveEOANonce,
      packSignature(receiveEOASignature),
      { from: charlie }
    );
    // Charlie balance = value
  };

  const step4_receiveWithAuthAA = async () => {
    // receiveWithAuthorization() with AA
    const receiveAANonce = hexStringFromBuffer(crypto.randomBytes(32));
    console.log("receiveAANonce: ", receiveAANonce);
    const receiveAASignature = signReceiveAuthorization(
      aliceWallet,
      charlie,
      value,
      validAfter,
      validBefore,
      receiveAANonce,
      domainSeparator,
      alicePrivateKey.slice(2)
    );
    console.log("receiveAASignature: ", receiveAASignature);
    return proxyAsV22.receiveWithAuthorization.request(
      aliceWallet,
      charlie,
      value,
      validAfter,
      validBefore,
      receiveAANonce,
      packSignature(receiveAASignature),
      { from: charlie }
    );
    // Charlie balance = value * 2
  };

  const step5_cancelAuthEOA = async () => {
    // cancelAuthorization() with EOA - this cancels a random unused authorization
    const cancelEOANonce = hexStringFromBuffer(crypto.randomBytes(32));
    console.log("cancelEOANonce: ", cancelEOANonce);
    const cancelEOASignature = signCancelAuthorization(
      alice,
      cancelEOANonce,
      domainSeparator,
      alicePrivateKey.slice(2)
    );
    console.log("cancelEOASignature: ", cancelEOASignature);
    return proxyAsV22.methods[
      "cancelAuthorization(address,bytes32,bytes)"
    ].request(alice, cancelEOANonce, packSignature(cancelEOASignature), {
      from: charlie,
    });
  };

  const step6_cancelAuthAA = async () => {
    // cancelAuthorization() with AA - this cancels a random unused authorization
    const cancelAANonce = hexStringFromBuffer(crypto.randomBytes(32));
    console.log("cancelAANonce: ", cancelAANonce);
    const cancelAASignature = signCancelAuthorization(
      aliceWallet,
      cancelAANonce,
      domainSeparator,
      alicePrivateKey.slice(2)
    );
    console.log("cancelAASignature: ", cancelAASignature);
    return proxyAsV22.methods[
      "cancelAuthorization(address,bytes32,bytes)"
    ].request(aliceWallet, cancelAANonce, packSignature(cancelAASignature), {
      from: charlie,
    });
  };

  const step7_permitAA = async () => {
    // permit() with AA
    const permitAASignature = signPermit(
      aliceWallet,
      bob,
      value,
      (await proxyAsV22.nonces(aliceWallet)).toNumber(),
      deadline,
      domainSeparator,
      alicePrivateKey.slice(2)
    );
    console.log("permitAASignature: ", permitAASignature);
    return proxyAsV22.permit.request(
      aliceWallet,
      bob,
      value,
      deadline,
      packSignature(permitAASignature),
      { from: charlie }
    );
  };

  const step8_permitEOA = async () => {
    // permit() with EOA
    const permitEOASignature = signPermit(
      bob,
      alice,
      value * 2,
      (await proxyAsV22.nonces(alice)).toNumber(),
      deadline,
      domainSeparator,
      bobPrivateKey.slice(2)
    );
    console.log("permitEOASignature: ", permitEOASignature);
    return proxyAsV22.permit.request(
      bob,
      alice,
      value * 2,
      deadline,
      packSignature(permitEOASignature),
      { from: charlie }
    );
  };

  const step9_transferFromBob = async () => {
    // Alice transfer (value * 2) from Bob (using allowance set in permit EOA tx above)
    return proxyAsV22.transferFrom.request(bob, alice, value * 2, {
      from: alice,
    });
  };

  const step10_approve = async () => {
    return proxyAsV22.approve.request(alice, value * 2, {
      from: charlie,
    });
  };

  const step11_transferFromCharlie = async () => {
    // Alice transfer (value * 2) from Charlie
    return proxyAsV22.transferFrom.request(charlie, alice, value * 2, {
      from: alice,
    });
  };
  const step12_blacklist = async () => {
    return proxyAsV22.blacklist.request(bob, {
      from: blacklister,
    });
  };

  const step13_unBlacklist = async () => {
    return proxyAsV22.unBlacklist.request(bob, {
      from: blacklister,
    });
  };

  const allPostUpgradeChecks = [
    ["step0_transfer", step0_transfer],
    ["step1_transferWithAuthEOA", step1_transferWithAuthEOA],
    ["step2_transferWithAuthAA", step2_transferWithAuthAA],
    ["step3_receiveWithAuthEOA", step3_receiveWithAuthEOA],
    ["step4_receiveWithAuthAA", step4_receiveWithAuthAA],
    ["step5_cancelAuthEOA", step5_cancelAuthEOA],
    ["step6_cancelAuthAA", step6_cancelAuthAA],
    ["step7_permitAA", step7_permitAA],
    ["step8_permitEOA", step8_permitEOA],
    ["step9_transferFromBob", step9_transferFromBob],
    ["step10_approve", step10_approve],
    ["step11_transferFromCharlie", step11_transferFromCharlie],
  ];
  if (shouldTestBlacklist) {
    allPostUpgradeChecks.push(["step12_blacklist", step12_blacklist]);
    allPostUpgradeChecks.push(["step13_unBlacklist", step13_unBlacklist]);
  }

  const fromStep = Math.max(0, from);
  const lastStepIndex = allPostUpgradeChecks.length - 1;
  const toStep =
    typeof to === "undefined" ? lastStepIndex : Math.min(to, lastStepIndex);
  assert(
    fromStep <= toStep,
    `Invalid from - to interval: from: ${fromStep}, to: ${toStep}`
  );

  for (let i = fromStep; i <= toStep; i++) {
    const [txName, createTx] = allPostUpgradeChecks[i];
    console.log(`\n>>> ${txName}: `);
    const rawTx = await createTx();
    console.log(rawTx);
    const tx = await web3.eth.sendTransaction(rawTx);
    console.log({
      txHash: tx.transactionHash,
      status: tx.status,
      gasUsed: tx.gasUsed,
    });
  }
}

module.exports = async (callback) => {
  // exposing `artifacts` and` `web3` as global objects to be used in helper modules
  global.web3 = web3;
  global.artifacts = artifacts;

  /* eslint-disable no-undef -- Config is a global variable in a truffle exec script https://github.com/trufflesuite/truffle/pull/3233 */
  const network = config.network;
  const rawValue = config.value;
  const rawFrom = config.f;
  const rawTo = config.to;
  const rawRecepientAddress = config.recepientAddress;
  const rawRecepientPrivateKey = config.recepientKey;
  const rawErc1271WalletAddress = config.erc1271Wallet;
  const testBlacklist = !!config.testBlacklist;
  const rawProxyAddress = config.proxyAddress;
  const rawDeployerAddress = config.deployerAddress;
  const rawDeployerPrivateKey = config.deployerKey;
  const rawRelayerAddress = config.relayerAddress;

  /* eslint-enable no-undef */
  const usageError = new Error(
    /* eslint-disable no-multi-str */
    "Usage: yarn truffle exec scripts/postUpgradeCheck.js \
    [--test-blacklist] \
    [--network=<NETWORK>] \
    [--value=<Amount of fiat token to transfer>] \
    [--f=<Index of the first check to perform>] \
    [--to=<Index of the last check to perform>] \
    [--erc1271-wallet=<0x-stripped ERC1271 wallet address>] \
    [--recepient-address=<0x-stripped recepient address>] \
    [--recepient-key=<0x-stripped recepient private key>] \
    --proxy-address=<0x-stripped proxy address> \
    --deployer-address=<0x-stripped deployer address> \
    --deployer-key=<0x-stripped deployer private key> \
    --relayer-address=<0x-stripped relayer address>"
  );

  // Truffle exec seems to auto parse a hex string passed in arguments into decimals.
  // We need to strip the 0x in arguments to prevent this from happening.
  const proxyAddress =
    network === "development" && !rawProxyAddress
      ? (await FiatTokenProxy.deployed()).address
      : `0x${rawProxyAddress}`;
  const deployerAddress = `0x${rawDeployerAddress}`;
  const deployerPrivateKey = rawDeployerPrivateKey
    ? `0x${rawDeployerPrivateKey}`
    : undefined;
  const recepientAddress = rawRecepientAddress
    ? `0x${rawRecepientAddress}`
    : undefined;
  const recepientPrivateKey = rawRecepientPrivateKey
    ? `0x${rawRecepientPrivateKey}`
    : undefined;
  const erc1271WalletAddress = rawErc1271WalletAddress
    ? `0x${rawErc1271WalletAddress}`
    : undefined;
  const relayerAddress = `0x${rawRelayerAddress}`;
  const value = rawValue ? BN(rawValue).toNumber() : 5e4; // default to 0.05 fiat token
  const from = rawFrom ? parseInt(rawFrom) : 0;
  const to = rawTo ? parseInt(rawTo) : undefined;

  console.log(`network: ${network}`);
  console.log(`value: ${value}`);
  console.log(`from: ${from}`);
  console.log(`to: ${to}`);
  console.log(`proxyAddress: ${proxyAddress}`);
  console.log(`deployerAddress: ${deployerAddress}`);
  console.log(`relayerAddress: ${relayerAddress}`);
  console.log(`recepientAddress: ${recepientAddress}`);
  console.log(`erc1271WalletAddress: ${erc1271WalletAddress}`);
  console.log(`testBlacklist: ${testBlacklist}`);

  if (
    !web3.utils.isAddress(proxyAddress) ||
    !web3.utils.isAddress(deployerAddress) ||
    !web3.utils.isAddress(relayerAddress) ||
    !deployerPrivateKey
  ) {
    callback(usageError);
  } else {
    try {
      await postUpgradeCheck(
        value,
        proxyAddress,
        deployerAddress,
        deployerPrivateKey,
        erc1271WalletAddress,
        recepientAddress,
        recepientPrivateKey,
        relayerAddress,
        testBlacklist,
        from,
        to
      );
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
