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
import {
  isNodeReady,
  getBalance,
  teardownCosmosClient,
  getErc20Denom,
  getErc20Balance,
  getDenomMetadata,
  getTotalSupply,
} from "./helpers/cosmosClient";
import { fundAccount, getFaucetBalance } from "./helpers/faucet";
import {
  setupFiatTokenInjectiveV2_2,
  teardownEvmClient,
  FiatTokenInjectiveV2_2Contract,
  getEvmWalletFromPrivateKey,
} from "./helpers/evmClient";
import { PrivateKey } from "@injectivelabs/sdk-ts";
import { fail } from "assert";

const INJ_DENOM = "inj";
const FAUCET_AMOUNT = "100000000000000000000"; // 100 INJ
const MINT_AMOUNT = BigInt(1_000_000); // 1 USDC (6 decimals)
const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

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
    const recipientKey = PrivateKey.generate().privateKey;
    const recipientAddress = recipientKey.toBech32();

    const result = await fundAccount(recipientAddress);
    expect(result.code).to.equal(0);

    const balance = await getBalance(recipientAddress, INJ_DENOM);
    expect(balance).to.equal(FAUCET_AMOUNT);
  });
});

describe("FiatTokenInjectiveV2_2 Integration Tests", function () {
  let fiatToken: FiatTokenInjectiveV2_2Contract;
  let proxyAddress: string;
  let erc20Denom: string;
  let deployerEvmAddress: string;
  let recipientEvmAddress: string;
  let recipientInjectiveAddress: string;

  before(async function () {
    const ready = await isNodeReady();
    if (!ready) {
      throw new Error("Injective localnet is not ready.");
    }

    // Deploy FiatTokenInjectiveV2_2
    const deployment = await setupFiatTokenInjectiveV2_2();
    fiatToken = deployment.fiatToken;
    proxyAddress = deployment.proxyAddress;
    erc20Denom = getErc20Denom(proxyAddress);
    deployerEvmAddress = deployment.deployerEvmAddress;

    // Configure deployer as minter with max allowance
    const configTx = await fiatToken.configureMinter(
      deployerEvmAddress,
      MAX_UINT256
    );
    await configTx.wait();

    // Generate and fund recipient account
    const recipientKey = PrivateKey.generate().privateKey;
    recipientInjectiveAddress = recipientKey.toBech32();
    const recipientWallet = getEvmWalletFromPrivateKey(
      recipientKey.toPrivateKeyHex()
    );
    recipientEvmAddress = recipientWallet.address;
    await fundAccount(recipientInjectiveAddress);
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
      // Get initial balances and allowance
      const initialEvmBalance = await fiatToken.balanceOf(recipientEvmAddress);
      const initialBankBalance = await getErc20Balance(
        recipientInjectiveAddress,
        proxyAddress
      );
      const initialMinterAllowance =
        await fiatToken.minterAllowance(deployerEvmAddress);

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

      // Verify minter allowance updated
      const finalMinterAllowance =
        await fiatToken.minterAllowance(deployerEvmAddress);
      expect(finalMinterAllowance).to.equal(
        initialMinterAllowance - MINT_AMOUNT
      );
    });

    it("should update totalSupply in both EVM and bank module", async () => {
      // Get initial total supply and allowance
      const initialEvmTotalSupply = await fiatToken.totalSupply();
      const initialBankTotalSupply = await getTotalSupply(erc20Denom);
      const initialMinterAllowance =
        await fiatToken.minterAllowance(deployerEvmAddress);

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

      // Verify minter allowance decreased by MINT_AMOUNT
      const finalMinterAllowance =
        await fiatToken.minterAllowance(deployerEvmAddress);
      expect(finalMinterAllowance).to.equal(
        initialMinterAllowance - MINT_AMOUNT
      );
    });

    it("should revert on balance overflow", async () => {
      // Generate a fresh recipient for this test
      const overflowRecipientKey = PrivateKey.generate().privateKey;
      const overflowRecipientWallet = getEvmWalletFromPrivateKey(
        overflowRecipientKey.toPrivateKeyHex()
      );
      const overflowRecipientEvmAddress = overflowRecipientWallet.address;

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

    it.skip("should revert when minter is blacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow mint after minter is unblacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should revert when recipient is blacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow mint to recipient after recipient is unblacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should revert when contract is paused", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow mint after contract is unpaused", async () => {
      // TODO: [SE-4572]
    });
  });
});
