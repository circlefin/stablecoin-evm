/**
 * Copyright 2026 Circle Internet Group, Inc. All rights reserved.
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

import { expect } from "chai";
import { fail } from "assert";
import { PrivateKey, getInjectiveAddress } from "@injectivelabs/sdk-ts";
import {
  isNodeReady,
  getBalance,
  teardownCosmosClient,
  getErc20Denom,
  getErc20Balance,
  getDenomMetadata,
  getTotalSupply,
  sendTokens,
} from "./helpers/cosmosClient";
import { fundAccount, getFaucetBalance } from "./helpers/faucet";
import {
  setupFiatTokenInjectiveV2_2,
  teardownEvmClient,
  FiatTokenInjectiveV2_2Contract,
  getEvmWalletFromPrivateKey,
} from "./helpers/evmClient";
import {
  createNamespace,
  queryNamespace,
  updateNamespaceActors,
  prepareUpdateActorRolesMessage,
  ROLE_IDS,
} from "../../scripts/injective/namespaceClient";
import { Network } from "@injectivelabs/networks";

const INJ_DENOM = "inj";
const FAUCET_AMOUNT = "100000000000000000000"; // 100 INJ
const MINT_AMOUNT = BigInt(1_000_000); // 1 (6 decimals)
const BURN_AMOUNT = BigInt(500_000); // 0.5 (6 decimals)
const TRANSFER_AMOUNT = BigInt(100_000); // 0.1 (6 decimals)
const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

// Role name constants for use throughout tests
const ROLE_NAMES = {
  EVERYONE: "EVERYONE",
  POLICY_ADMIN: "policyAdmin",
  CONTRACT_HOOK_ADMIN: "contractHookAdmin",
  ROLE_PERMISSIONS_ADMIN: "rolePermissionsAdmin",
  ROLE_MANAGERS_ADMIN: "roleManagersAdmin",
} as const;

// Helper to map role IDs to names
const ROLE_ID_TO_NAME: Record<number, string> = {
  [ROLE_IDS.EVERYONE]: ROLE_NAMES.EVERYONE,
  [ROLE_IDS.POLICY_ADMIN]: ROLE_NAMES.POLICY_ADMIN,
  [ROLE_IDS.CONTRACT_HOOK_ADMIN]: ROLE_NAMES.CONTRACT_HOOK_ADMIN,
  [ROLE_IDS.ROLE_PERMISSIONS_ADMIN]: ROLE_NAMES.ROLE_PERMISSIONS_ADMIN,
  [ROLE_IDS.ROLE_MANAGERS_ADMIN]: ROLE_NAMES.ROLE_MANAGERS_ADMIN,
};

/**
 * Generate a new account with EVM and Injective addresses
 * @returns Account with private key, EVM address, and Injective address
 */
function generateAddress(): {
  privateKey: string;
  evmAddress: string;
  injectiveAddress: string;
} {
  const key = PrivateKey.generate().privateKey;
  const privateKey = key.toPrivateKeyHex();
  const wallet = getEvmWalletFromPrivateKey(privateKey);
  const evmAddress = wallet.address;
  const injectiveAddress = getInjectiveAddress(evmAddress);
  return { privateKey, evmAddress, injectiveAddress };
}

describe("Faucet Functionality", function () {
  before(async function () {
    const ready = await isNodeReady();
    if (!ready) {
      throw new Error("Injective localnet is not ready.");
    }
  });

  it("should have sufficient faucet balance", async () => {
    const balance = await getFaucetBalance();
    expect(BigInt(balance) > BigInt(0)).to.be.true;
  });

  it("should fund a new account with INJ from faucet", async () => {
    const recipient = generateAddress();

    const result = await fundAccount(recipient.injectiveAddress);
    expect(result.code).to.equal(0);

    const balance = await getBalance(recipient.injectiveAddress, INJ_DENOM);
    expect(balance).to.equal(FAUCET_AMOUNT);
  });
});

describe("FiatTokenInjectiveV2_2 Integration Tests", function () {
  let fiatToken: FiatTokenInjectiveV2_2Contract;
  let proxyAddress: string;
  let erc20Denom: string;
  let deployerPrivateKey: string;
  let deployerEvmAddress: string;
  let deployerInjectiveAddress: string;
  let recipientEvmAddress: string;
  let recipientInjectiveAddress: string;
  // Dedicated admin addresses for namespace (separate from deployer/minter)
  // Each role has a different address to ensure they don't get grouped together
  let policyAdminInjectiveAddress: string;
  let contractHookAdminInjectiveAddress: string;
  let rolePermissionsAdminInjectiveAddress: string;
  let roleManagersAdminPrivateKey: string;
  let roleManagersAdminInjectiveAddress: string;

  before(async function () {
    const ready = await isNodeReady();
    if (!ready) {
      throw new Error("Injective localnet is not ready.");
    }

    // Deploy FiatTokenInjectiveV2_2
    const deployment = await setupFiatTokenInjectiveV2_2();
    fiatToken = deployment.fiatToken;
    proxyAddress = deployment.proxyAddress;
    deployerPrivateKey = deployment.deployerPrivateKey;
    erc20Denom = getErc20Denom(proxyAddress);
    deployerEvmAddress = deployment.deployerEvmAddress;
    deployerInjectiveAddress = getInjectiveAddress(deployerEvmAddress);

    // Configure deployer as minter with max allowance
    const configTx = await fiatToken.configureMinter(
      deployerEvmAddress,
      MAX_UINT256
    );
    await configTx.wait();

    // Generate and fund recipient account (non-admin user to test EVERYONE role)
    const recipient = generateAddress();
    recipientEvmAddress = recipient.evmAddress;
    recipientInjectiveAddress = recipient.injectiveAddress;
    await fundAccount(recipientInjectiveAddress);

    // Generate four different admin addresses for namespace roles
    // This ensures each role has a unique address and they don't get grouped together
    const policyAdmin = generateAddress();
    policyAdminInjectiveAddress = policyAdmin.injectiveAddress;
    await fundAccount(policyAdminInjectiveAddress);

    const contractHookAdmin = generateAddress();
    contractHookAdminInjectiveAddress = contractHookAdmin.injectiveAddress;
    await fundAccount(contractHookAdminInjectiveAddress);

    const rolePermissionsAdmin = generateAddress();
    rolePermissionsAdminInjectiveAddress =
      rolePermissionsAdmin.injectiveAddress;
    await fundAccount(rolePermissionsAdminInjectiveAddress);

    const roleManagersAdmin = generateAddress();
    roleManagersAdminPrivateKey = roleManagersAdmin.privateKey;
    roleManagersAdminInjectiveAddress = roleManagersAdmin.injectiveAddress;
    await fundAccount(roleManagersAdminInjectiveAddress);

    // Create namespace: deployer must be the signer (as token admin)
    // Assign each admin role to a different address
    try {
      await createNamespace({
        fiatTokenProxyAddress: proxyAddress,
        policyAdmin: policyAdminInjectiveAddress,
        contractHookAdmin: contractHookAdminInjectiveAddress,
        rolePermissionsAdmin: rolePermissionsAdminInjectiveAddress,
        roleManagersAdmin: roleManagersAdminInjectiveAddress,
        signerPrivateKey: deployerPrivateKey, // Must be deployer (token admin)
        network: Network.Local,
        useRestApi: true, // Use REST API for broadcasting
      });
    } catch (error) {
      // If namespace already exists from a previous test run, that's OK
      if (
        !(error instanceof Error && error.message.includes("already exists"))
      ) {
        throw error;
      }
    }
  });

  after(() => {
    teardownCosmosClient();
    teardownEvmClient();
  });

  describe("Read Queries", () => {
    it("should have matching metadata in EVM and bank module", async () => {
      // Query EVM metadata
      const evmName = await fiatToken.name();
      const evmSymbol = await fiatToken.symbol();
      const evmDecimals = await fiatToken.decimals();

      // Query bank module metadata
      const bankMetadata = await getDenomMetadata(erc20Denom);

      // Verify they match
      expect(bankMetadata).to.not.be.null;
      expect(bankMetadata?.name).to.equal(evmName);
      expect(bankMetadata?.symbol).to.equal(evmSymbol);
      expect(bankMetadata?.decimals).to.equal(Number(evmDecimals));
    });

    it("should have matching balance in EVM and bank module", async () => {
      // Query EVM balance
      const evmBalance = await fiatToken.balanceOf(recipientEvmAddress);

      // Query bank module balance
      const bankBalance = await getErc20Balance(
        recipientInjectiveAddress,
        proxyAddress
      );

      // Verify they match
      expect(bankBalance).to.equal(evmBalance.toString());

      // Mint tokens
      const mintTx = await fiatToken.mint(recipientEvmAddress, MINT_AMOUNT);
      await mintTx.wait();

      // Verify EVM balance updated
      const finalEvmBalance = await fiatToken.balanceOf(recipientEvmAddress);
      expect(finalEvmBalance).to.equal(evmBalance + MINT_AMOUNT);

      // Verify bank module balance updated
      const finalBankBalance = await getErc20Balance(
        recipientInjectiveAddress,
        proxyAddress
      );
      expect(finalBankBalance).to.equal(
        (BigInt(bankBalance) + MINT_AMOUNT).toString()
      );

      // Verify EVM and bank module balances match
      expect(finalBankBalance).to.equal(finalEvmBalance.toString());
    });

    it("should have matching total supply in EVM and bank module", async () => {
      // Query EVM total supply
      const evmTotalSupply = await fiatToken.totalSupply();

      // Query bank module total supply
      const bankTotalSupply = await getTotalSupply(erc20Denom);

      // Verify they match
      expect(bankTotalSupply).to.equal(evmTotalSupply.toString());

      // Mint tokens
      const mintTx = await fiatToken.mint(recipientEvmAddress, MINT_AMOUNT);
      await mintTx.wait();

      // Verify EVM total supply updated
      const finalEvmTotalSupply = await fiatToken.totalSupply();
      expect(finalEvmTotalSupply).to.equal(evmTotalSupply + MINT_AMOUNT);

      // Verify bank module total supply updated
      const finalBankTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalBankTotalSupply).to.equal(
        (BigInt(bankTotalSupply) + MINT_AMOUNT).toString()
      );

      // Verify EVM and bank module total supplies match
      expect(finalBankTotalSupply).to.equal(finalEvmTotalSupply.toString());
    });
  });

  describe("Mint", () => {
    it("should update recipient balance in both EVM and bank module", async () => {
      // Get initial balances
      const initialEvmBalance = await fiatToken.balanceOf(recipientEvmAddress);
      const initialBankBalance = await getErc20Balance(
        recipientInjectiveAddress,
        proxyAddress
      );

      // Mint tokens
      const mintTx = await fiatToken.mint(recipientEvmAddress, MINT_AMOUNT);
      await mintTx.wait();

      // Verify EVM balance updated
      const finalEvmBalance = await fiatToken.balanceOf(recipientEvmAddress);
      expect(finalEvmBalance).to.equal(initialEvmBalance + MINT_AMOUNT);

      // Verify bank module balance updated
      const finalBankBalance = await getErc20Balance(
        recipientInjectiveAddress,
        proxyAddress
      );
      expect(finalBankBalance).to.equal(
        (BigInt(initialBankBalance) + MINT_AMOUNT).toString()
      );

      // Verify EVM and bank module balances match
      expect(finalBankBalance).to.equal(finalEvmBalance.toString());
    });

    it("should update totalSupply in both EVM and bank module", async () => {
      // Get initial total supply
      const initialEvmTotalSupply = await fiatToken.totalSupply();
      const initialBankTotalSupply = await getTotalSupply(erc20Denom);

      // Mint tokens
      const mintTx = await fiatToken.mint(recipientEvmAddress, MINT_AMOUNT);
      await mintTx.wait();

      // Verify EVM total supply updated
      const finalEvmTotalSupply = await fiatToken.totalSupply();
      expect(finalEvmTotalSupply).to.equal(initialEvmTotalSupply + MINT_AMOUNT);

      // Verify bank module total supply updated
      const finalBankTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalBankTotalSupply).to.equal(
        (BigInt(initialBankTotalSupply) + MINT_AMOUNT).toString()
      );

      // Verify EVM and bank module total supplies match
      expect(finalBankTotalSupply).to.equal(finalEvmTotalSupply.toString());
    });

    it("should revert on balance overflow", async () => {
      // Generate a fresh recipient for this test
      const overflowRecipient = generateAddress();
      const overflowRecipientEvmAddress = overflowRecipient.evmAddress;

      // Mint half of overflow amount to the overflow recipient
      // This amount is chosen to not interfere with other tests
      const overflowAmount = BigInt(2) ** BigInt(256);
      const mintHalfMaxTx = await fiatToken.mint(
        overflowRecipientEvmAddress,
        overflowAmount / BigInt(2)
      );
      await mintHalfMaxTx.wait();

      // Reconfigure minter with max allowance
      const setupConfigTx = await fiatToken.configureMinter(
        deployerEvmAddress,
        MAX_UINT256
      );
      await setupConfigTx.wait();

      // Attempt to mint the other half of overflow amount
      // This should revert due to overflow in the Solidity balance check
      try {
        const mintMaxTx = await fiatToken.mint(
          overflowRecipientEvmAddress,
          overflowAmount / BigInt(2)
        );
        await mintMaxTx.wait();
        fail("Expected mint to revert but it succeeded");
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).to.include(
            `execution reverted: "integer overflow: precompile panic"`
          );
        } else {
          fail("Failed to assert error message");
        }
      }
    });

    it("should revert when minter is blacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const initialTotalSupply = await fiatToken.totalSupply();

      // Blacklist the minter (deployer)
      const blacklistTx = await fiatToken.blacklist(deployerEvmAddress);
      await blacklistTx.wait();

      // Attempt to mint - should fail
      try {
        const mintTx = await fiatToken.mint(
          testRecipient.evmAddress,
          MINT_AMOUNT
        );
        await mintTx.wait();
        expect.fail("Mint should have been reverted for blacklisted minter");
      } catch (error) {
        expect(error).to.exist;
      }

      // Verify no balance changes occurred
      const finalRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const finalTotalSupply = await fiatToken.totalSupply();
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unblacklist minter for next test
      const unblacklistTx = await fiatToken.unBlacklist(deployerEvmAddress);
      await unblacklistTx.wait();
    });

    it("should allow mint after minter is unblacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Explicitly blacklist THEN unblacklist minter to match test name
      const blacklistTx = await fiatToken.blacklist(deployerEvmAddress);
      await blacklistTx.wait();

      const unblacklistTx = await fiatToken.unBlacklist(deployerEvmAddress);
      await unblacklistTx.wait();

      // Mint should now succeed
      const initialBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const mintTx = await fiatToken.mint(
        testRecipient.evmAddress,
        MINT_AMOUNT
      );
      await mintTx.wait();

      const finalBalance = await fiatToken.balanceOf(testRecipient.evmAddress);
      expect(finalBalance).to.equal(initialBalance + MINT_AMOUNT);
    });

    it("should revert when recipient is blacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const initialTotalSupply = await fiatToken.totalSupply();

      // Blacklist the recipient
      const blacklistTx = await fiatToken.blacklist(testRecipient.evmAddress);
      await blacklistTx.wait();

      // Attempt to mint - should fail
      try {
        const mintTx = await fiatToken.mint(
          testRecipient.evmAddress,
          MINT_AMOUNT
        );
        await mintTx.wait();
        expect.fail("Mint should have been reverted for blacklisted recipient");
      } catch (error) {
        expect(error).to.exist;
      }

      // Verify no balance changes occurred
      const finalRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const finalTotalSupply = await fiatToken.totalSupply();
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);
    });

    it("should allow mint to recipient after recipient is unblacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Explicitly blacklist THEN unblacklist to match test name
      const blacklistTx = await fiatToken.blacklist(testRecipient.evmAddress);
      await blacklistTx.wait();

      const unblacklistTx = await fiatToken.unBlacklist(
        testRecipient.evmAddress
      );
      await unblacklistTx.wait();

      // Mint should now succeed
      const initialBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const mintTx = await fiatToken.mint(
        testRecipient.evmAddress,
        MINT_AMOUNT
      );
      await mintTx.wait();

      const finalBalance = await fiatToken.balanceOf(testRecipient.evmAddress);
      expect(finalBalance).to.equal(initialBalance + MINT_AMOUNT);
    });

    it("should revert when contract is paused", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const initialTotalSupply = await fiatToken.totalSupply();

      // Pause the contract
      const pauseTx = await fiatToken.pause();
      await pauseTx.wait();

      // Attempt to mint - should fail
      try {
        const mintTx = await fiatToken.mint(
          testRecipient.evmAddress,
          MINT_AMOUNT
        );
        await mintTx.wait();
        expect.fail("Mint should have been reverted when contract is paused");
      } catch (error) {
        expect(error).to.exist;
      }

      // Verify no balance changes occurred
      const finalRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const finalTotalSupply = await fiatToken.totalSupply();
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unpause for next test
      const unpauseTx = await fiatToken.unpause();
      await unpauseTx.wait();
    });

    it("should allow mint after contract is unpaused", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Explicitly pause THEN unpause to match test name
      const pauseTx = await fiatToken.pause();
      await pauseTx.wait();

      const unpauseTx = await fiatToken.unpause();
      await unpauseTx.wait();

      // Mint should now succeed
      const initialBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const mintTx = await fiatToken.mint(
        testRecipient.evmAddress,
        MINT_AMOUNT
      );
      await mintTx.wait();

      const finalBalance = await fiatToken.balanceOf(testRecipient.evmAddress);
      expect(finalBalance).to.equal(initialBalance + MINT_AMOUNT);
    });
  });

  describe("Burn", () => {
    before(async () => {
      // Mint tokens to the minter (deployer) to prepare for burn
      const mintTx = await fiatToken.mint(deployerEvmAddress, MINT_AMOUNT);
      await mintTx.wait();
    });

    it("should update minter balance in both EVM and bank module", async () => {
      // Get initial balance
      const initialEvmBalance = await fiatToken.balanceOf(deployerEvmAddress);
      const initialBankBalance = await getErc20Balance(
        deployerInjectiveAddress,
        proxyAddress
      );

      // Burn tokens
      const burnTx = await fiatToken.burn(BURN_AMOUNT);
      await burnTx.wait();

      // Verify EVM balance decreased
      const finalEvmBalance = await fiatToken.balanceOf(deployerEvmAddress);
      expect(finalEvmBalance).to.equal(initialEvmBalance - BURN_AMOUNT);

      // Verify bank module balance decreased
      const finalBankBalance = await getErc20Balance(
        deployerInjectiveAddress,
        proxyAddress
      );
      expect(finalBankBalance).to.equal(
        (BigInt(initialBankBalance) - BURN_AMOUNT).toString()
      );

      // Verify EVM and bank module balances match
      expect(finalBankBalance).to.equal(finalEvmBalance.toString());
    });

    it("should update totalSupply in both EVM and bank module", async () => {
      // Get initial total supply
      const initialEvmTotalSupply = await fiatToken.totalSupply();
      const initialBankTotalSupply = await getTotalSupply(erc20Denom);

      // Burn tokens
      const burnTx = await fiatToken.burn(BURN_AMOUNT);
      await burnTx.wait();

      // Verify EVM total supply decreased
      const finalEvmTotalSupply = await fiatToken.totalSupply();
      expect(finalEvmTotalSupply).to.equal(initialEvmTotalSupply - BURN_AMOUNT);

      // Verify bank module total supply decreased
      const finalBankTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalBankTotalSupply).to.equal(
        (BigInt(initialBankTotalSupply) - BURN_AMOUNT).toString()
      );

      // Verify EVM and bank module total supplies match
      expect(finalBankTotalSupply).to.equal(finalEvmTotalSupply.toString());
    });

    it("should revert when minter is blacklisted", async () => {
      // Get initial balances
      const initialMinterBalance =
        await fiatToken.balanceOf(deployerEvmAddress);
      const initialTotalSupply = await fiatToken.totalSupply();

      // Blacklist the minter (deployer)
      const blacklistTx = await fiatToken.blacklist(deployerEvmAddress);
      await blacklistTx.wait();

      // Attempt to burn - should fail
      try {
        const burnTx = await fiatToken.burn(BURN_AMOUNT);
        await burnTx.wait();
        expect.fail("Burn should have been reverted for blacklisted minter");
      } catch (error) {
        expect(error).to.exist;
      }

      // Verify no balance changes occurred
      const finalMinterBalance = await fiatToken.balanceOf(deployerEvmAddress);
      const finalTotalSupply = await fiatToken.totalSupply();
      expect(finalMinterBalance).to.equal(initialMinterBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unblacklist minter for next test
      const unblacklistTx = await fiatToken.unBlacklist(deployerEvmAddress);
      await unblacklistTx.wait();
    });

    it("should allow burn after minter is unblacklisted", async () => {
      // Explicitly blacklist THEN unblacklist minter to match test name
      const blacklistTx = await fiatToken.blacklist(deployerEvmAddress);
      await blacklistTx.wait();

      const unblacklistTx = await fiatToken.unBlacklist(deployerEvmAddress);
      await unblacklistTx.wait();

      // Mint tokens first to ensure sufficient balance for burn
      const mintTx = await fiatToken.mint(deployerEvmAddress, MINT_AMOUNT);
      await mintTx.wait();

      // Burn should now succeed
      const initialBalance = await fiatToken.balanceOf(deployerEvmAddress);
      const burnTx = await fiatToken.burn(BURN_AMOUNT);
      await burnTx.wait();

      const finalBalance = await fiatToken.balanceOf(deployerEvmAddress);
      expect(finalBalance).to.equal(initialBalance - BURN_AMOUNT);
    });

    it("should revert when contract is paused", async () => {
      // Get initial balances
      const initialMinterBalance =
        await fiatToken.balanceOf(deployerEvmAddress);
      const initialTotalSupply = await fiatToken.totalSupply();

      // Pause the contract
      const pauseTx = await fiatToken.pause();
      await pauseTx.wait();

      // Attempt to burn - should fail
      try {
        const burnTx = await fiatToken.burn(BURN_AMOUNT);
        await burnTx.wait();
        expect.fail("Burn should have been reverted when contract is paused");
      } catch (error) {
        expect(error).to.exist;
      }

      // Verify no balance changes occurred
      const finalMinterBalance = await fiatToken.balanceOf(deployerEvmAddress);
      const finalTotalSupply = await fiatToken.totalSupply();
      expect(finalMinterBalance).to.equal(initialMinterBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unpause for next test
      const unpauseTx = await fiatToken.unpause();
      await unpauseTx.wait();
    });

    it("should allow burn after contract is unpaused", async () => {
      // Explicitly pause THEN unpause to match test name
      const pauseTx = await fiatToken.pause();
      await pauseTx.wait();

      const unpauseTx = await fiatToken.unpause();
      await unpauseTx.wait();

      // Mint tokens first to ensure sufficient balance for burn
      const mintTx = await fiatToken.mint(deployerEvmAddress, MINT_AMOUNT);
      await mintTx.wait();

      // Burn should now succeed
      const initialBalance = await fiatToken.balanceOf(deployerEvmAddress);
      const burnTx = await fiatToken.burn(BURN_AMOUNT);
      await burnTx.wait();

      const finalBalance = await fiatToken.balanceOf(deployerEvmAddress);
      expect(finalBalance).to.equal(initialBalance - BURN_AMOUNT);
    });
  });

  describe("Transfer", () => {
    let senderPrivateKey: string;
    let senderEvmAddress: string;
    let senderInjectiveAddress: string;

    before(async () => {
      // Use deployer as sender (already has minter role configured)
      senderPrivateKey = deployerPrivateKey;
      senderEvmAddress = deployerEvmAddress;
      senderInjectiveAddress = deployerInjectiveAddress;

      // Mint some tokens to sender for transfer tests
      const mintTx = await fiatToken.mint(
        senderEvmAddress,
        MINT_AMOUNT * BigInt(10)
      );
      await mintTx.wait();
    });

    it("should update sender and recipient balances in both EVM and bank module", async () => {
      // Get initial balances
      const initialSenderEvmBalance =
        await fiatToken.balanceOf(senderEvmAddress);
      const initialSenderBankBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const initialRecipientEvmBalance =
        await fiatToken.balanceOf(recipientEvmAddress);
      const initialRecipientBankBalance = await getErc20Balance(
        recipientInjectiveAddress,
        proxyAddress
      );

      // Get initial total supply to sanity check
      const initialEvmTotalSupply = await fiatToken.totalSupply();
      const initialBankTotalSupply = await getTotalSupply(erc20Denom);

      // Transfer tokens
      const transferTx = await fiatToken.transfer(
        recipientEvmAddress,
        TRANSFER_AMOUNT
      );
      await transferTx.wait();

      // Verify sender EVM balance decreased
      const finalSenderEvmBalance = await fiatToken.balanceOf(senderEvmAddress);
      expect(finalSenderEvmBalance).to.equal(
        initialSenderEvmBalance - TRANSFER_AMOUNT
      );

      // Verify sender bank balance decreased
      const finalSenderBankBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      expect(finalSenderBankBalance).to.equal(
        (BigInt(initialSenderBankBalance) - TRANSFER_AMOUNT).toString()
      );

      // Verify sender EVM and bank balances match
      expect(finalSenderBankBalance).to.equal(finalSenderEvmBalance.toString());

      // Verify recipient EVM balance increased
      const finalRecipientEvmBalance =
        await fiatToken.balanceOf(recipientEvmAddress);
      expect(finalRecipientEvmBalance).to.equal(
        initialRecipientEvmBalance + TRANSFER_AMOUNT
      );

      // Verify recipient bank balance increased
      const finalRecipientBankBalance = await getErc20Balance(
        recipientInjectiveAddress,
        proxyAddress
      );
      expect(finalRecipientBankBalance).to.equal(
        (BigInt(initialRecipientBankBalance) + TRANSFER_AMOUNT).toString()
      );

      // Verify recipient EVM and bank balances match
      expect(finalRecipientBankBalance).to.equal(
        finalRecipientEvmBalance.toString()
      );

      // Sanity check: total supply should remain unchanged
      const finalEvmTotalSupply = await fiatToken.totalSupply();
      expect(finalEvmTotalSupply).to.equal(initialEvmTotalSupply);

      const finalBankTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalBankTotalSupply).to.equal(initialBankTotalSupply);
    });

    it("should revert transfer via EVM layer when sender is blacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialSenderBalance = await fiatToken.balanceOf(senderEvmAddress);
      const initialRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const initialTotalSupply = await fiatToken.totalSupply();

      // Blacklist the sender
      const blacklistTx = await fiatToken.blacklist(senderEvmAddress);
      await blacklistTx.wait();

      // Attempt EVM layer transfer (should be blocked)
      try {
        const transferTx = await fiatToken.transfer(
          testRecipient.evmAddress,
          TRANSFER_AMOUNT
        );
        await transferTx.wait();
        expect.fail(
          "EVM transfer should have been reverted for blacklisted sender"
        );
      } catch (error) {
        expect(error).to.exist;
      }

      // Verify no balance changes occurred
      const finalSenderBalance = await fiatToken.balanceOf(senderEvmAddress);
      const finalRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const finalTotalSupply = await fiatToken.totalSupply();
      expect(finalSenderBalance).to.equal(initialSenderBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unblacklist sender for next test
      const unblacklistTx = await fiatToken.unBlacklist(senderEvmAddress);
      await unblacklistTx.wait();
    });

    it("should revert transfer via Cosmos layer when sender is blacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const initialRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const initialTotalSupply = await getTotalSupply(erc20Denom);

      // Blacklist the sender
      const blacklistTx = await fiatToken.blacklist(senderEvmAddress);
      await blacklistTx.wait();

      // Attempt Cosmos layer transfer (should be blocked by isTransferRestricted)
      try {
        const senderKey = PrivateKey.fromHex(
          senderPrivateKey.replace("0x", "")
        );
        await sendTokens(
          senderKey,
          testRecipient.injectiveAddress,
          TRANSFER_AMOUNT.toString(),
          erc20Denom
        );
        expect.fail("Transfer should have been restricted");
      } catch (error) {
        expect(error).to.exist;
        // Cosmos layer should reject the transfer
      }

      // Verify no balance changes occurred
      const finalSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const finalRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const finalTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalSenderBalance).to.equal(initialSenderBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unblacklist sender for next test
      const unblacklistTx = await fiatToken.unBlacklist(senderEvmAddress);
      await unblacklistTx.wait();
    });

    it("should allow transfer via Cosmos layer after sender is unblacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Explicitly blacklist THEN unblacklist sender to match test name
      const blacklistTx = await fiatToken.blacklist(senderEvmAddress);
      await blacklistTx.wait();

      const unblacklistTx = await fiatToken.unBlacklist(senderEvmAddress);
      await unblacklistTx.wait();

      // Transfer should now succeed
      const initialBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );

      const senderKey = PrivateKey.fromHex(senderPrivateKey.replace("0x", ""));
      await sendTokens(
        senderKey,
        testRecipient.injectiveAddress,
        TRANSFER_AMOUNT.toString(),
        erc20Denom
      );

      const finalBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      expect(BigInt(finalBalance)).to.equal(
        BigInt(initialBalance) + TRANSFER_AMOUNT
      );
    });

    it("should revert transfer via EVM layer when recipient is blacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialSenderBalance = await fiatToken.balanceOf(senderEvmAddress);
      const initialRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const initialTotalSupply = await fiatToken.totalSupply();

      // Blacklist the recipient
      const blacklistTx = await fiatToken.blacklist(testRecipient.evmAddress);
      await blacklistTx.wait();

      // Attempt EVM layer transfer (should be blocked)
      try {
        const transferTx = await fiatToken.transfer(
          testRecipient.evmAddress,
          TRANSFER_AMOUNT
        );
        await transferTx.wait();
        expect.fail(
          "EVM transfer should have been reverted for blacklisted recipient"
        );
      } catch (error) {
        expect(error).to.exist;
      }

      // Verify no balance changes occurred
      const finalSenderBalance = await fiatToken.balanceOf(senderEvmAddress);
      const finalRecipientBalance = await fiatToken.balanceOf(
        testRecipient.evmAddress
      );
      const finalTotalSupply = await fiatToken.totalSupply();
      expect(finalSenderBalance).to.equal(initialSenderBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);
    });

    it("should revert transfer via Cosmos layer when recipient is blacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const initialRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const initialTotalSupply = await getTotalSupply(erc20Denom);

      // Blacklist the recipient
      const blacklistTx = await fiatToken.blacklist(testRecipient.evmAddress);
      await blacklistTx.wait();

      // Attempt Cosmos layer transfer (should be blocked by isTransferRestricted)
      try {
        const senderKey = PrivateKey.fromHex(
          senderPrivateKey.replace("0x", "")
        );
        await sendTokens(
          senderKey,
          testRecipient.injectiveAddress,
          TRANSFER_AMOUNT.toString(),
          erc20Denom
        );
        expect.fail("Transfer should have been restricted");
      } catch (error) {
        expect(error).to.exist;
        // Cosmos layer should reject the transfer
      }

      // Verify no balance changes occurred
      const finalSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const finalRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const finalTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalSenderBalance).to.equal(initialSenderBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);
    });

    it("should allow transfer via Cosmos layer after recipient is unblacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Explicitly blacklist THEN unblacklist recipient to match test name
      const blacklistTx = await fiatToken.blacklist(testRecipient.evmAddress);
      await blacklistTx.wait();

      const unblacklistTx = await fiatToken.unBlacklist(
        testRecipient.evmAddress
      );
      await unblacklistTx.wait();

      // Transfer should now succeed
      const initialBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );

      const senderKey = PrivateKey.fromHex(senderPrivateKey.replace("0x", ""));
      await sendTokens(
        senderKey,
        testRecipient.injectiveAddress,
        TRANSFER_AMOUNT.toString(),
        erc20Denom
      );

      const finalBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      expect(BigInt(finalBalance)).to.equal(
        BigInt(initialBalance) + TRANSFER_AMOUNT
      );
    });

    it("should revert transfer via Cosmos layer when both sender and recipient are blacklisted", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const initialRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const initialTotalSupply = await getTotalSupply(erc20Denom);

      // Blacklist both sender and recipient
      const blacklistSenderTx = await fiatToken.blacklist(senderEvmAddress);
      await blacklistSenderTx.wait();

      const blacklistRecipientTx = await fiatToken.blacklist(
        testRecipient.evmAddress
      );
      await blacklistRecipientTx.wait();

      // Attempt Cosmos layer transfer (should be blocked by isTransferRestricted)
      try {
        const senderKey = PrivateKey.fromHex(
          senderPrivateKey.replace("0x", "")
        );
        await sendTokens(
          senderKey,
          testRecipient.injectiveAddress,
          TRANSFER_AMOUNT.toString(),
          erc20Denom
        );
        expect.fail(
          "Transfer should have been restricted when both parties are blacklisted"
        );
      } catch (error) {
        expect(error).to.exist;
        // Cosmos layer should reject the transfer
      }

      // Verify no balance changes occurred
      const finalSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const finalRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const finalTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalSenderBalance).to.equal(initialSenderBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unblacklist sender for next test
      const unblacklistSenderTx = await fiatToken.unBlacklist(senderEvmAddress);
      await unblacklistSenderTx.wait();

      // No need to unblacklist recipient - fresh address used
    });

    it("should revert transfer via Cosmos layer when contract is paused", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Get initial balances
      const initialSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const initialRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const initialTotalSupply = await getTotalSupply(erc20Denom);

      // Pause the contract
      const pauseTx = await fiatToken.pause();
      await pauseTx.wait();

      // Attempt Cosmos layer transfer (should be blocked by isTransferRestricted)
      try {
        const senderKey = PrivateKey.fromHex(
          senderPrivateKey.replace("0x", "")
        );
        await sendTokens(
          senderKey,
          testRecipient.injectiveAddress,
          TRANSFER_AMOUNT.toString(),
          erc20Denom
        );
        expect.fail("Transfer should have been restricted");
      } catch (error) {
        expect(error).to.exist;
        // Cosmos layer should reject the transfer
      }

      // Verify no balance changes occurred
      const finalSenderBalance = await getErc20Balance(
        senderInjectiveAddress,
        proxyAddress
      );
      const finalRecipientBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      const finalTotalSupply = await getTotalSupply(erc20Denom);
      expect(finalSenderBalance).to.equal(initialSenderBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);
      expect(finalTotalSupply).to.equal(initialTotalSupply);

      // Unpause for next test
      const unpauseTx = await fiatToken.unpause();
      await unpauseTx.wait();
    });

    it("should allow transfer via Cosmos layer after contract is unpaused", async () => {
      // Generate fresh recipient for this test
      const testRecipient = generateAddress();

      // Explicitly pause THEN unpause to match test name
      const pauseTx = await fiatToken.pause();
      await pauseTx.wait();

      const unpauseTx = await fiatToken.unpause();
      await unpauseTx.wait();

      // Transfer should now succeed
      const initialBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );

      const senderKey = PrivateKey.fromHex(senderPrivateKey.replace("0x", ""));
      await sendTokens(
        senderKey,
        testRecipient.injectiveAddress,
        TRANSFER_AMOUNT.toString(),
        erc20Denom
      );

      const finalBalance = await getErc20Balance(
        testRecipient.injectiveAddress,
        proxyAddress
      );
      expect(BigInt(finalBalance)).to.equal(
        BigInt(initialBalance) + TRANSFER_AMOUNT
      );
    });

    describe("Namespace Management", () => {
      let adminAccount: {
        privateKey: string;
        evmAddress: string;
        injectiveAddress: string;
      };

      before(async () => {
        // Generate and fund admin account
        adminAccount = generateAddress();
        await fundAccount(adminAccount.injectiveAddress);
      });

      it("should query namespace created in setup", async () => {
        // Query using REST API to see evmHook field
        const namespace = await queryNamespace(
          proxyAddress,
          Network.Local,
          true
        );

        // Verify basic namespace properties
        expect(namespace.denom).to.equal(erc20Denom);
        expect(namespace.contractHook).to.equal("");

        // Verify evmHook is set to proxy address (when using REST API)
        expect(namespace.evmHook).to.equal(proxyAddress);

        // Verify all 5 roles exist
        expect(namespace.rolePermissions).to.be.an("array");
        expect(namespace.rolePermissions.length).to.equal(5);

        // Map role IDs to names for validation
        const roleNames = namespace.rolePermissions.map(
          (rp: { roleId: number }) => ROLE_ID_TO_NAME[rp.roleId]
        );
        expect(roleNames).to.include.members([
          ROLE_NAMES.EVERYONE,
          ROLE_NAMES.POLICY_ADMIN,
          ROLE_NAMES.CONTRACT_HOOK_ADMIN,
          ROLE_NAMES.ROLE_PERMISSIONS_ADMIN,
          ROLE_NAMES.ROLE_MANAGERS_ADMIN,
        ]);

        // Helper to verify an actor has the expected role
        const verifyActorHasRole = (actorAddress: string, roleName: string) => {
          const actor = namespace.actorRoles.find(
            (ar) => ar.actor === actorAddress
          );
          expect(actor, `Actor ${actorAddress} should exist`).to.exist;
          expect(actor?.roles, `Actor should have ${roleName} role`).to.include(
            roleName
          );
        };

        // Verify each admin role is assigned to a different address
        verifyActorHasRole(
          policyAdminInjectiveAddress,
          ROLE_NAMES.POLICY_ADMIN
        );
        verifyActorHasRole(
          contractHookAdminInjectiveAddress,
          ROLE_NAMES.CONTRACT_HOOK_ADMIN
        );
        verifyActorHasRole(
          rolePermissionsAdminInjectiveAddress,
          ROLE_NAMES.ROLE_PERMISSIONS_ADMIN
        );
        verifyActorHasRole(
          roleManagersAdminInjectiveAddress,
          ROLE_NAMES.ROLE_MANAGERS_ADMIN
        );

        // Verify deployer does NOT have admin roles (only EVERYONE role)
        const deployerActorRole = namespace.actorRoles.find(
          (ar: { actor: string }) => ar.actor === deployerInjectiveAddress
        );
        // Deployer should not appear in actorRoles since they only have EVERYONE role
        expect(deployerActorRole).to.be.undefined;
      });

      it("should fail to create duplicate namespace", async () => {
        // Try to create namespace with exact same parameters as in before() hook
        try {
          await createNamespace({
            fiatTokenProxyAddress: proxyAddress,
            policyAdmin: policyAdminInjectiveAddress,
            contractHookAdmin: contractHookAdminInjectiveAddress,
            rolePermissionsAdmin: rolePermissionsAdminInjectiveAddress,
            roleManagersAdmin: roleManagersAdminInjectiveAddress,
            signerPrivateKey: deployerPrivateKey,
            network: Network.Local,
            useRestApi: true,
          });
          expect.fail("Should have thrown an error for duplicate namespace");
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect((error as Error).message).to.include("already exists");
        }
      });

      describe("Namespace Validation", () => {
        it("should have valid role manager structure", async () => {
          const namespace = await queryNamespace(proxyAddress, Network.Local);

          expect(namespace.roleManagers).to.be.an("array");
          expect(namespace.roleManagers.length).to.be.greaterThan(0);

          namespace.roleManagers.forEach(
            (rm: { manager: string; roles: string[] }) => {
              expect(rm.manager).to.exist;
              expect(rm).to.have.property("roles");
              expect(rm.roles).to.be.an("array");
              expect(rm.manager).to.match(/^inj1[a-z0-9]{38}$/);
            }
          );
        });

        it("should have empty contract hook for ERC20 namespace", async () => {
          const namespace = await queryNamespace(proxyAddress, Network.Local);

          expect(namespace.contractHook).to.equal("");
        });

        it("should match denom format (erc20:{address})", async () => {
          const namespace = await queryNamespace(proxyAddress, Network.Local);

          expect(namespace.denom).to.match(/^erc20:0x[a-fA-F0-9]{40}$/);
          expect(namespace.denom).to.equal(erc20Denom);
        });
      });

      describe("updateNamespaceActors Helper Function", () => {
        let newPolicyAdmin: {
          privateKey: string;
          evmAddress: string;
          injectiveAddress: string;
        };
        let newContractHookAdmin: {
          privateKey: string;
          evmAddress: string;
          injectiveAddress: string;
        };
        let newRolePermissionsAdmin: {
          privateKey: string;
          evmAddress: string;
          injectiveAddress: string;
        };

        before(async () => {
          // Generate and fund new admin accounts for rotation
          const generateAndFundAccount = async () => {
            const account = generateAddress();
            await fundAccount(account.injectiveAddress);
            return account;
          };

          newPolicyAdmin = await generateAndFundAccount();
          newContractHookAdmin = await generateAndFundAccount();
          newRolePermissionsAdmin = await generateAndFundAccount();
        });

        it("should rotate a single admin role", async () => {
          // Rotate only policyAdmin (using namespace admin who has roleManagersAdmin)
          const txHash = await updateNamespaceActors(
            proxyAddress,
            {
              policyAdmin: newPolicyAdmin.injectiveAddress,
            },
            roleManagersAdminPrivateKey,
            Network.Local
          );

          expect(txHash).to.be.a("string");
          expect(txHash.length).to.be.greaterThan(0);

          // Verify the change
          const namespace = await queryNamespace(proxyAddress, Network.Local);
          const policyAdminActor = namespace.actorRoles.find(
            (ar: { actor: string }) =>
              ar.actor === newPolicyAdmin.injectiveAddress
          );
          expect(policyAdminActor).to.exist;
          expect(policyAdminActor?.roles).to.include(ROLE_NAMES.POLICY_ADMIN);

          // Verify old admin (deployer) no longer has policyAdmin role
          const oldAdminActor = namespace.actorRoles.find(
            (ar: { actor: string }) => ar.actor === deployerInjectiveAddress
          );
          if (oldAdminActor) {
            expect(oldAdminActor.roles).to.not.include(ROLE_NAMES.POLICY_ADMIN);
          }
        });

        it("should rotate multiple admin roles simultaneously", async () => {
          // Rotate contractHookAdmin and rolePermissionsAdmin (using namespace admin)
          // Note: roleManagersAdmin cannot be rotated through updateNamespaceActors
          const txHash = await updateNamespaceActors(
            proxyAddress,
            {
              contractHookAdmin: newContractHookAdmin.injectiveAddress,
              rolePermissionsAdmin: newRolePermissionsAdmin.injectiveAddress,
            },
            roleManagersAdminPrivateKey,
            Network.Local
          );

          expect(txHash).to.be.a("string");
          expect(txHash.length).to.be.greaterThan(0);

          // Verify all changes
          const namespace = await queryNamespace(proxyAddress, Network.Local);

          const contractHookActor = namespace.actorRoles.find(
            (ar: { actor: string }) =>
              ar.actor === newContractHookAdmin.injectiveAddress
          );
          expect(contractHookActor).to.exist;
          expect(contractHookActor?.roles).to.include(
            ROLE_NAMES.CONTRACT_HOOK_ADMIN
          );

          const rolePermissionsActor = namespace.actorRoles.find(
            (ar: { actor: string }) =>
              ar.actor === newRolePermissionsAdmin.injectiveAddress
          );
          expect(rolePermissionsActor).to.exist;
          expect(rolePermissionsActor?.roles).to.include(
            ROLE_NAMES.ROLE_PERMISSIONS_ADMIN
          );
        });

        it("should verify roleManagers list is unchanged after actor rotation", async () => {
          const namespace = await queryNamespace(proxyAddress, Network.Local);

          // The roleManagers list should still contain the namespace admin (original admin)
          // because updateNamespaceActors only updates actorRoles, not roleManagers
          const originalAdminStillInManagers = namespace.roleManagers.some(
            (rm: { manager: string }) =>
              rm.manager === roleManagersAdminInjectiveAddress
          );

          expect(originalAdminStillInManagers).to.be.true;
        });

        it("should fail to rotate with unauthorized signer", async () => {
          const unauthorized = generateAddress();
          await fundAccount(unauthorized.injectiveAddress);

          try {
            await updateNamespaceActors(
              proxyAddress,
              {
                policyAdmin: unauthorized.evmAddress,
              },
              unauthorized.privateKey,
              Network.Local
            );
            expect.fail(
              "Should have thrown an error for unauthorized rotation"
            );
          } catch (error) {
            // Expected to fail
            expect(error).to.exist;
          }
        });

        it("should preserve other namespace fields when updating actors", async () => {
          const namespaceBefore = await queryNamespace(
            proxyAddress,
            Network.Local
          );

          // Rotate one admin using the original admin (who is still in roleManagers list)
          const testAccount = generateAddress();
          await fundAccount(testAccount.injectiveAddress);

          await updateNamespaceActors(
            proxyAddress,
            {
              contractHookAdmin: testAccount.injectiveAddress,
            },
            roleManagersAdminPrivateKey, // Use namespace admin who is in roleManagers list
            Network.Local
          );

          const namespaceAfter = await queryNamespace(
            proxyAddress,
            Network.Local
          );

          // Verify other fields remain unchanged
          expect(namespaceAfter.denom).to.equal(namespaceBefore.denom);
          expect(namespaceAfter.contractHook).to.equal(
            namespaceBefore.contractHook
          );
          expect(namespaceAfter.rolePermissions.length).to.equal(
            namespaceBefore.rolePermissions.length
          );
          expect(namespaceAfter.roleManagers.length).to.equal(
            namespaceBefore.roleManagers.length
          );
        });

        it("should not send new admin addresses to API during prepareUpdateActorRolesMessage", async () => {
          // Create test accounts that don't exist on chain
          const testNewPolicyAdmin = generateAddress();
          const testNewContractHookAdmin = generateAddress();

          // Intercept fetch calls to verify what's being sent to API
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const originalFetch = (global as any).fetch;
          const fetchCalls: Array<{ url: string; body?: string }> = [];

          try {
            // Mock fetch to capture all API calls
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (global as any).fetch = async (url: string, options?: any) => {
              const callInfo: { url: string; body?: string } = { url };
              if (options?.body) {
                callInfo.body =
                  typeof options.body === "string"
                    ? options.body
                    : JSON.stringify(options.body);
              }
              fetchCalls.push(callInfo);

              // Call original fetch
              return originalFetch(url, options);
            };

            // Call prepareUpdateActorRolesMessage
            const result = await prepareUpdateActorRolesMessage(
              proxyAddress,
              roleManagersAdminInjectiveAddress,
              {
                policyAdmin: testNewPolicyAdmin.injectiveAddress,
                contractHookAdmin: testNewContractHookAdmin.injectiveAddress,
              },
              Network.Local
            );

            // Verify the message was prepared successfully
            expect(result.msg).to.exist;
            expect(result.denom).to.equal(erc20Denom);

            // Verify fetch calls
            expect(fetchCalls.length).to.be.greaterThan(0);

            // Check each fetch call to ensure new admin addresses are NOT in the URL or body
            for (const call of fetchCalls) {
              // Check URL doesn't contain new admin addresses
              expect(call.url).to.not.include(
                testNewPolicyAdmin.evmAddress.toLowerCase()
              );
              expect(call.url).to.not.include(
                testNewPolicyAdmin.injectiveAddress
              );
              expect(call.url).to.not.include(
                testNewContractHookAdmin.evmAddress.toLowerCase()
              );
              expect(call.url).to.not.include(
                testNewContractHookAdmin.injectiveAddress
              );

              // Check body doesn't contain new admin addresses (if body exists)
              if (call.body) {
                const bodyLower = call.body.toLowerCase();
                expect(bodyLower).to.not.include(
                  testNewPolicyAdmin.evmAddress.toLowerCase()
                );
                expect(bodyLower).to.not.include(
                  testNewPolicyAdmin.injectiveAddress
                );
                expect(bodyLower).to.not.include(
                  testNewContractHookAdmin.evmAddress.toLowerCase()
                );
                expect(bodyLower).to.not.include(
                  testNewContractHookAdmin.injectiveAddress
                );
              }

              // Verify that the URL contains the current role manager address or proxy address
              // (This confirms we're querying current state, not sending new addresses)
              const urlLower = call.url.toLowerCase();
              const containsCurrentInfo =
                urlLower.includes(proxyAddress.toLowerCase()) ||
                urlLower.includes(erc20Denom.toLowerCase()) ||
                urlLower.includes("namespace");
              expect(
                containsCurrentInfo,
                `API call should query current namespace info: ${call.url}`
              ).to.be.true;
            }
          } finally {
            // Restore original fetch
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (global as any).fetch = originalFetch;
          }
        });
      });

      describe("Address Validation", () => {
        it("should reject invalid fiatTokenProxyAddress in createNamespace", async () => {
          try {
            await createNamespace({
              fiatTokenProxyAddress: "invalid-address",
              policyAdmin: deployerEvmAddress,
              contractHookAdmin: deployerEvmAddress,
              rolePermissionsAdmin: deployerEvmAddress,
              roleManagersAdmin: deployerEvmAddress,
              signerPrivateKey: deployerPrivateKey,
              network: Network.Local,
            });
            expect.fail("Should have thrown an error");
          } catch (error) {
            expect(error instanceof Error).to.be.true;
            expect((error as Error).message).to.include(
              "Invalid EVM address for fiatTokenProxyAddress"
            );
          }
        });

        it("should reject EVM address for policyAdmin in createNamespace", async () => {
          try {
            await createNamespace({
              fiatTokenProxyAddress: proxyAddress,
              policyAdmin: deployerEvmAddress,
              contractHookAdmin: deployerInjectiveAddress,
              rolePermissionsAdmin: deployerInjectiveAddress,
              roleManagersAdmin: deployerInjectiveAddress,
              signerPrivateKey: deployerPrivateKey,
              network: Network.Local,
            });
            expect.fail("Should have thrown an error");
          } catch (error) {
            expect(error instanceof Error).to.be.true;
            expect((error as Error).message).to.include(
              "Invalid Injective address for policyAdmin"
            );
            expect((error as Error).message).to.include(deployerEvmAddress);
          }
        });

        it("should reject invalid contractHookAdmin address", async () => {
          try {
            await createNamespace({
              fiatTokenProxyAddress: proxyAddress,
              policyAdmin: deployerInjectiveAddress,
              contractHookAdmin: "0xINVALID",
              rolePermissionsAdmin: deployerInjectiveAddress,
              roleManagersAdmin: deployerInjectiveAddress,
              signerPrivateKey: deployerPrivateKey,
              network: Network.Local,
            });
            expect.fail("Should have thrown an error");
          } catch (error) {
            expect(error instanceof Error).to.be.true;
            expect((error as Error).message).to.include(
              "Invalid Injective address for contractHookAdmin"
            );
          }
        });

        it("should reject invalid private key", async () => {
          try {
            await createNamespace({
              fiatTokenProxyAddress: proxyAddress,
              policyAdmin: deployerInjectiveAddress,
              contractHookAdmin: deployerInjectiveAddress,
              rolePermissionsAdmin: deployerInjectiveAddress,
              roleManagersAdmin: deployerInjectiveAddress,
              signerPrivateKey: "invalid-key",
              network: Network.Local,
            });
            expect.fail("Should have thrown an error");
          } catch (error) {
            expect(error instanceof Error).to.be.true;
            expect((error as Error).message).to.include("Invalid private key");
          }
        });

        it("should reject invalid address in queryNamespace", async () => {
          try {
            await queryNamespace("invalid-address", Network.Local);
            expect.fail("Should have thrown an error");
          } catch (error) {
            expect(error instanceof Error).to.be.true;
            expect((error as Error).message).to.include(
              "Invalid EVM address for fiatTokenProxyAddress"
            );
          }
        });
      });

      describe("Authorization", () => {
        it("should fail when non-signer attempts to create namespace", async () => {
          // Generate a random account that is not the token deployer
          const unauthorized = generateAddress();

          // Fund the unauthorized account so it has gas
          await fundAccount(unauthorized.injectiveAddress);

          // Try to create a namespace with a different proxy address using unauthorized signer
          // This should fail because only the token deployer/owner can create namespace
          const randomProxyAddress = unauthorized.evmAddress;

          try {
            await createNamespace({
              fiatTokenProxyAddress: randomProxyAddress,
              policyAdmin: policyAdminInjectiveAddress,
              contractHookAdmin: contractHookAdminInjectiveAddress,
              rolePermissionsAdmin: rolePermissionsAdminInjectiveAddress,
              roleManagersAdmin: roleManagersAdminInjectiveAddress,
              signerPrivateKey: unauthorized.privateKey, // Unauthorized signer
              network: Network.Local,
              useRestApi: true,
            });
            expect.fail("Should have thrown an error for unauthorized signer");
          } catch (error) {
            // Using an unauthorized signer should throw an error
            expect(error).to.be.instanceOf(Error);
            const errorMessage = (error as Error).message;
            expect(errorMessage).to.include("unauthorized account");
          }
        });
      });
    });
  });
});
