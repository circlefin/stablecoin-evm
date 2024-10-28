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

import crypto from "crypto";
import {
  FiatTokenV1Instance,
  FiatTokenV2Instance,
  FiatTokenProxyInstance,
} from "../../@types/generated";
import { signTransferAuthorization } from "./GasAbstraction/helpers";
import {
  MAX_UINT256_HEX,
  ACCOUNTS_AND_KEYS,
  accounts,
} from "../helpers/constants";
import {
  hexStringFromBuffer,
  expectRevert,
  linkLibraryToTokenContract,
} from "../helpers";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const V2Upgrader = artifacts.require("V2Upgrader");

describe("V2Upgrader", () => {
  let fiatTokenProxy: FiatTokenProxyInstance;
  let proxyAsV1: FiatTokenV1Instance;
  let proxyAsV2: FiatTokenV2Instance;
  let v1Implementation: FiatTokenV1Instance;
  let v2Implementation: FiatTokenV2Instance;
  const {
    minterAccount: minter,
    masterMinterAccount,
    pauserAccount,
    blacklisterAccount,
    tokenOwnerAccount,
    proxyOwnerAccount: originalProxyAdmin,
  } = accounts;

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenV2);
  });

  beforeEach(async () => {
    v1Implementation = await FiatTokenV1.new();
    v2Implementation = await FiatTokenV2.new();
    fiatTokenProxy = await FiatTokenProxy.new(v1Implementation.address, {
      from: originalProxyAdmin,
    });
    proxyAsV1 = await FiatTokenV1.at(fiatTokenProxy.address);
    await proxyAsV1.initialize(
      "USD//C",
      "USDC",
      "USD",
      6,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      tokenOwnerAccount
    );
    proxyAsV2 = await FiatTokenV2.at(fiatTokenProxy.address);

    await proxyAsV1.configureMinter(minter, 2e5, {
      from: await proxyAsV1.masterMinter(),
    });
    await proxyAsV1.mint(minter, 2e5, { from: minter });
  });

  describe("upgrade", () => {
    it("upgrades, transfers proxy admin role to newProxyAdmin, runs tests, and self-destructs", async () => {
      // Run the test on the contracts deployed by Truffle to ensure the Truffle
      // migration is written correctly
      const upgrader = await V2Upgrader.new(
        fiatTokenProxy.address,
        v2Implementation.address,
        await fiatTokenProxy.admin(),
        "USDC"
      );
      const upgraderOwner = await upgrader.owner();

      expect(await upgrader.proxy()).to.equal(fiatTokenProxy.address);
      expect(await upgrader.implementation()).to.equal(
        v2Implementation.address
      );
      expect(await upgrader.helper()).not.to.be.empty;
      expect(await upgrader.newProxyAdmin()).to.equal(originalProxyAdmin);
      expect(await upgrader.newName()).to.equal("USDC");

      // Transfer 0.2 FiatToken to the contract
      await proxyAsV1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await fiatTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call upgrade
      await upgrader.upgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await fiatTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is updated to V2
      expect(await fiatTokenProxy.implementation()).to.equal(
        v2Implementation.address
      );

      // Test that things work as expected
      expect(await proxyAsV2.name()).to.equal("USDC");
      expect((await proxyAsV2.balanceOf(upgrader.address)).toNumber()).to.equal(
        0
      );
      expect((await proxyAsV2.balanceOf(upgraderOwner)).toNumber()).to.equal(
        2e5
      );

      const [user, user2] = ACCOUNTS_AND_KEYS;
      await proxyAsV2.transfer(user.address, 2e5, { from: upgraderOwner });
      expect((await proxyAsV2.balanceOf(user.address)).toNumber()).to.equal(
        2e5
      );

      // Test Gas Abstraction
      const nonce = hexStringFromBuffer(crypto.randomBytes(32));

      const invalidAuthorization = signTransferAuthorization(
        user.address,
        minter,
        1e5,
        0,
        MAX_UINT256_HEX,
        nonce,
        await proxyAsV2.DOMAIN_SEPARATOR(),
        user2.key // Signed with someone else's key
      );
      // Fails when given an invalid authorization
      await expectRevert(
        proxyAsV2.transferWithAuthorization(
          user.address,
          minter,
          1e5,
          0,
          MAX_UINT256_HEX,
          nonce,
          invalidAuthorization.v,
          invalidAuthorization.r,
          invalidAuthorization.s,
          { from: minter }
        ),
        "invalid signature"
      );

      const validAuthorization = signTransferAuthorization(
        user.address,
        minter,
        1e5,
        0,
        MAX_UINT256_HEX,
        nonce,
        await proxyAsV2.DOMAIN_SEPARATOR(),
        user.key
      );

      // Succeeds when given a valid authorization
      await proxyAsV2.transferWithAuthorization(
        user.address,
        minter,
        1e5,
        0,
        MAX_UINT256_HEX,
        nonce,
        validAuthorization.v,
        validAuthorization.r,
        validAuthorization.s,
        { from: minter }
      );

      expect((await proxyAsV2.balanceOf(user.address)).toNumber()).to.equal(
        1e5
      );
      expect((await proxyAsV2.balanceOf(minter)).toNumber()).to.equal(1e5);
    });

    it("reverts if there is an error", async () => {
      fiatTokenProxy = await FiatTokenProxy.new(v1Implementation.address, {
        from: originalProxyAdmin,
      });
      const fiatTokenV1_1 = await FiatTokenV1_1.new();
      const upgraderOwner = accounts.deployerAccount;

      const upgrader = await V2Upgrader.new(
        fiatTokenProxy.address,
        fiatTokenV1_1.address, // provide V1.1 implementation instead of V2
        originalProxyAdmin,
        "USDC",
        { from: upgraderOwner }
      );

      // Transfer 0.2 FiatToken to the contract
      await proxyAsV1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await fiatTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Upgrade should fail because initializeV2 function doesn't exist on V1.1
      await expectRevert(upgrader.upgrade({ from: upgraderOwner }), "revert");

      // The proxy admin role is not transferred
      expect(await fiatTokenProxy.admin()).to.equal(upgrader.address);

      // The implementation is left unchanged
      expect(await fiatTokenProxy.implementation()).to.equal(
        v1Implementation.address
      );
    });
  });

  describe("abortUpgrade", () => {
    it("transfers proxy admin role to newProxyAdmin and self-destructs", async () => {
      fiatTokenProxy = await FiatTokenProxy.new(v1Implementation.address, {
        from: originalProxyAdmin,
      });
      const upgraderOwner = accounts.deployerAccount;
      const upgrader = await V2Upgrader.new(
        fiatTokenProxy.address,
        v2Implementation.address,
        originalProxyAdmin,
        "USDC",
        { from: upgraderOwner }
      );

      // Transfer 0.2 FiatToken to the contract
      await proxyAsV1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await fiatTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call abortUpgrade
      await upgrader.abortUpgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await fiatTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is left unchanged
      expect(await fiatTokenProxy.implementation()).to.equal(
        v1Implementation.address
      );
    });
  });
});
