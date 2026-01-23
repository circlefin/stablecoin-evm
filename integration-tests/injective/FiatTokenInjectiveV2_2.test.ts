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
  ROLE_IDS,
} from "../../scripts/injective/namespaceClient";
import { Network } from "@injectivelabs/networks";

const INJ_DENOM = "inj";
const FAUCET_AMOUNT = "100000000000000000000"; // 100 INJ
const MINT_AMOUNT = BigInt(1_000_000); // 1 USDC (6 decimals)
const BURN_AMOUNT = BigInt(500_000); // 0.5 USDC (6 decimals)
const TRANSFER_AMOUNT = BigInt(100_000); // 0.1 USDC (6 decimals)
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
  let policyAdminEvmAddress: string;
  let policyAdminInjectiveAddress: string;
  let contractHookAdminEvmAddress: string;
  let contractHookAdminInjectiveAddress: string;
  let rolePermissionsAdminEvmAddress: string;
  let rolePermissionsAdminInjectiveAddress: string;
  let roleManagersAdminPrivateKey: string;
  let roleManagersAdminEvmAddress: string;
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
    policyAdminEvmAddress = policyAdmin.evmAddress;
    policyAdminInjectiveAddress = policyAdmin.injectiveAddress;
    await fundAccount(policyAdminInjectiveAddress);

    const contractHookAdmin = generateAddress();
    contractHookAdminEvmAddress = contractHookAdmin.evmAddress;
    contractHookAdminInjectiveAddress = contractHookAdmin.injectiveAddress;
    await fundAccount(contractHookAdminInjectiveAddress);

    const rolePermissionsAdmin = generateAddress();
    rolePermissionsAdminEvmAddress = rolePermissionsAdmin.evmAddress;
    rolePermissionsAdminInjectiveAddress =
      rolePermissionsAdmin.injectiveAddress;
    await fundAccount(rolePermissionsAdminInjectiveAddress);

    const roleManagersAdmin = generateAddress();
    roleManagersAdminPrivateKey = roleManagersAdmin.privateKey;
    roleManagersAdminEvmAddress = roleManagersAdmin.evmAddress;
    roleManagersAdminInjectiveAddress = roleManagersAdmin.injectiveAddress;
    await fundAccount(roleManagersAdminInjectiveAddress);

    // Create namespace: deployer must be the signer (as token admin)
    // Assign each admin role to a different address
    try {
      await createNamespace({
        usdcProxyAddress: proxyAddress,
        policyAdmin: policyAdminEvmAddress,
        contractHookAdmin: contractHookAdminEvmAddress,
        rolePermissionsAdmin: rolePermissionsAdminEvmAddress,
        roleManagersAdmin: roleManagersAdminEvmAddress,
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

    it.skip("should revert when minter is blacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow burn after minter is unblacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should revert when contract is paused", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow burn after contract is unpaused", async () => {
      // TODO: [SE-4572]
    });
  });

  describe("Transfer", () => {
    let senderEvmAddress: string;
    let senderInjectiveAddress: string;

    before(async () => {
      // Use deployer as sender (already has minter role configured)
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

    it.skip("should revert when sender is blacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow transfer after sender is unblacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should revert when recipient is blacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow transfer after recipient is unblacklisted", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should revert when contract is paused", async () => {
      // TODO: [SE-4572]
    });

    it.skip("should allow transfer after contract is unpaused", async () => {
      // TODO: [SE-4572]
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
            usdcProxyAddress: proxyAddress,
            policyAdmin: policyAdminEvmAddress,
            contractHookAdmin: contractHookAdminEvmAddress,
            rolePermissionsAdmin: rolePermissionsAdminEvmAddress,
            roleManagersAdmin: roleManagersAdminEvmAddress,
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
        let newRoleManagersAdmin: {
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
          newRoleManagersAdmin = await generateAndFundAccount();
        });

        it("should rotate a single admin role", async () => {
          // Rotate only policyAdmin (using namespace admin who has roleManagersAdmin)
          const txHash = await updateNamespaceActors(
            proxyAddress,
            {
              policyAdmin: newPolicyAdmin.evmAddress,
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
          // Rotate all remaining admin roles (using namespace admin)
          const txHash = await updateNamespaceActors(
            proxyAddress,
            {
              contractHookAdmin: newContractHookAdmin.evmAddress,
              rolePermissionsAdmin: newRolePermissionsAdmin.evmAddress,
              roleManagersAdmin: newRoleManagersAdmin.evmAddress,
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
          expect(contractHookActor?.roles).to.include(
            ROLE_NAMES.CONTRACT_HOOK_ADMIN
          );

          const rolePermissionsActor = namespace.actorRoles.find(
            (ar: { actor: string }) =>
              ar.actor === newRolePermissionsAdmin.injectiveAddress
          );
          expect(rolePermissionsActor?.roles).to.include(
            ROLE_NAMES.ROLE_PERMISSIONS_ADMIN
          );

          const roleManagersActor = namespace.actorRoles.find(
            (ar: { actor: string }) =>
              ar.actor === newRoleManagersAdmin.injectiveAddress
          );
          expect(roleManagersActor?.roles).to.include(
            ROLE_NAMES.ROLE_MANAGERS_ADMIN
          );
        });

        it("should verify old admin (namespace admin) is completely removed from actorRoles", async () => {
          const namespace = await queryNamespace(proxyAddress, Network.Local);

          // Old namespace admin should not have any actor roles anymore (all rotated)
          const oldAdminActor = namespace.actorRoles.find(
            (ar: { actor: string }) =>
              ar.actor === roleManagersAdminInjectiveAddress
          );

          // Either the actor doesn't exist or has no admin roles
          if (oldAdminActor) {
            expect(oldAdminActor.roles).to.not.include(ROLE_NAMES.POLICY_ADMIN);
            expect(oldAdminActor.roles).to.not.include(
              ROLE_NAMES.CONTRACT_HOOK_ADMIN
            );
            expect(oldAdminActor.roles).to.not.include(
              ROLE_NAMES.ROLE_PERMISSIONS_ADMIN
            );
            expect(oldAdminActor.roles).to.not.include(
              ROLE_NAMES.ROLE_MANAGERS_ADMIN
            );
          }
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

        it("should verify new roleManagersAdmin actor has the role but not in managers list", async () => {
          const namespace = await queryNamespace(proxyAddress, Network.Local);

          // Verify newRoleManagersAdmin has the actor role
          const newRoleManagerActor = namespace.actorRoles.find(
            (ar: { actor: string }) =>
              ar.actor === newRoleManagersAdmin.injectiveAddress
          );
          expect(newRoleManagerActor?.roles).to.include(
            ROLE_NAMES.ROLE_MANAGERS_ADMIN
          );

          // But verify it's NOT in the roleManagers list
          // (because updateNamespaceActors only updates actorRoles, not roleManagers)
          const newRoleManagerInManagersList = namespace.roleManagers.some(
            (rm: { manager: string }) =>
              rm.manager === newRoleManagersAdmin.injectiveAddress
          );
          expect(newRoleManagerInManagersList).to.be.false;

          // Verify namespace admin (original admin) is still in roleManagers list
          const originalAdminInManagersList = namespace.roleManagers.some(
            (rm: { manager: string }) =>
              rm.manager === roleManagersAdminInjectiveAddress
          );
          expect(originalAdminInManagersList).to.be.true;
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
              contractHookAdmin: testAccount.evmAddress,
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
      });

      describe("Address Validation", () => {
        const injectiveAddress = "inj1wzvhjux9rqfdcwspp37srdgwp5tac7wgplgfd7";

        it("should reject invalid usdcProxyAddress in createNamespace", async () => {
          try {
            await createNamespace({
              usdcProxyAddress: "invalid-address",
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
              "Invalid EVM address for usdcProxyAddress"
            );
          }
        });

        it("should reject Injective address for policyAdmin in createNamespace", async () => {
          try {
            await createNamespace({
              usdcProxyAddress: proxyAddress,
              policyAdmin: injectiveAddress,
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
              "Invalid EVM address for policyAdmin"
            );
            expect((error as Error).message).to.include(injectiveAddress);
          }
        });

        it("should reject invalid contractHookAdmin address", async () => {
          try {
            await createNamespace({
              usdcProxyAddress: proxyAddress,
              policyAdmin: deployerEvmAddress,
              contractHookAdmin: "0xINVALID",
              rolePermissionsAdmin: deployerEvmAddress,
              roleManagersAdmin: deployerEvmAddress,
              signerPrivateKey: deployerPrivateKey,
              network: Network.Local,
            });
            expect.fail("Should have thrown an error");
          } catch (error) {
            expect(error instanceof Error).to.be.true;
            expect((error as Error).message).to.include(
              "Invalid EVM address for contractHookAdmin"
            );
          }
        });

        it("should reject invalid private key", async () => {
          try {
            await createNamespace({
              usdcProxyAddress: proxyAddress,
              policyAdmin: deployerEvmAddress,
              contractHookAdmin: deployerEvmAddress,
              rolePermissionsAdmin: deployerEvmAddress,
              roleManagersAdmin: deployerEvmAddress,
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
              "Invalid EVM address for usdcProxyAddress"
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
              usdcProxyAddress: randomProxyAddress,
              policyAdmin: policyAdminEvmAddress,
              contractHookAdmin: contractHookAdminEvmAddress,
              rolePermissionsAdmin: rolePermissionsAdminEvmAddress,
              roleManagersAdmin: roleManagersAdminEvmAddress,
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
