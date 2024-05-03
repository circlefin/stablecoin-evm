/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
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

import {
  FiatTokenProxyInstance,
  FiatTokenV2_1Instance,
  FiatTokenV2_2Instance,
  V2_2UpgraderInstance,
} from "../../@types/generated";
import {
  expectRevert,
  generateAccounts,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../helpers";
import { toLower } from "lodash";
import { BLOCK_GAS_LIMIT, accounts } from "../helpers/constants";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

const {
  minterAccount: minter,
  proxyOwnerAccount: originalProxyAdmin,
  lostAndFoundAccount: lostAndFound,
  arbitraryAccount: alice,
  arbitraryAccount2: bob,
  masterMinterAccount: v2_1MasterMinter,
  pauserAccount,
  blacklisterAccount,
  tokenOwnerAccount,
} = accounts;

describe("V2_2Upgrader", () => {
  let fiatTokenProxy: FiatTokenProxyInstance;
  let proxyAsV2_1: FiatTokenV2_1Instance;
  let proxyAsV2_2: FiatTokenV2_2Instance;
  let v2_1Implementation: FiatTokenV2_1Instance;
  let v2_2Implementation: FiatTokenV2_2Instance;
  let v2_2Upgrader: V2_2UpgraderInstance;
  let upgraderOwner: string;

  const newSymbol = "USDCUSDC"; // Use a symbol different from original symbol
  const accountsToBlacklist = generateAccounts(10);

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenV2_1);
    await linkLibraryToTokenContract(FiatTokenV2_2);

    v2_1Implementation = await FiatTokenV2_1.new();
    v2_2Implementation = await FiatTokenV2_2.new();
    fiatTokenProxy = await FiatTokenProxy.new(v2_1Implementation.address, {
      from: originalProxyAdmin,
    });
    v2_2Upgrader = await V2_2Upgrader.new(
      fiatTokenProxy.address,
      v2_2Implementation.address,
      await fiatTokenProxy.admin(),
      accountsToBlacklist,
      newSymbol
    );

    proxyAsV2_1 = await FiatTokenV2_1.at(fiatTokenProxy.address);
    proxyAsV2_2 = await FiatTokenV2_2.at(fiatTokenProxy.address);
    upgraderOwner = await v2_2Upgrader.owner();

    // Upgrade from v1 to v2.1
    await proxyAsV2_1.initialize(
      "USD//C",
      "USDC",
      "USD",
      6,
      v2_1MasterMinter,
      pauserAccount,
      blacklisterAccount,
      tokenOwnerAccount
    );
    await fiatTokenProxy.upgradeTo(v2_1Implementation.address, {
      from: originalProxyAdmin,
    });
    await proxyAsV2_1.initializeV2("USDC");
    await proxyAsV2_1.initializeV2_1(lostAndFound);

    // Initially blacklist all these accounts.
    await Promise.all(
      accountsToBlacklist.map((account) =>
        proxyAsV2_2.blacklist(account, { from: blacklisterAccount })
      )
    );
  });

  describe("proxy", () => {
    it("should return the correct address", async () => {
      expect(await v2_2Upgrader.proxy()).to.equal(fiatTokenProxy.address);
    });
  });

  describe("implementation", () => {
    it("should return the correct address", async () => {
      expect(await v2_2Upgrader.implementation()).to.equal(
        v2_2Implementation.address
      );
    });
  });

  describe("helper", () => {
    it("should be non empty", async () => {
      expect(await v2_2Upgrader.helper()).to.not.be.empty;
    });
  });

  describe("newProxyAdmin", () => {
    it("should return the correct address", async () => {
      expect(await v2_2Upgrader.newProxyAdmin()).to.equal(originalProxyAdmin);
    });
  });

  describe("accountsToBlacklist", () => {
    it("should return the correct list of addresses", async () => {
      const actualAccountsToBlacklist = await v2_2Upgrader.accountsToBlacklist();
      expect(actualAccountsToBlacklist.map(toLower)).to.deep.equal(
        accountsToBlacklist.map(toLower)
      );
    });
  });

  describe("withdrawFiatToken", () => {
    it("should return the FiatToken to the transaction sender", async () => {
      // Mint 0.2 FiatToken.
      await proxyAsV2_1.configureMinter(minter, 2e5, {
        from: v2_1MasterMinter,
      });
      await proxyAsV2_1.mint(minter, 2e5, { from: minter });
      expect((await proxyAsV2_1.balanceOf(minter)).toNumber()).to.equal(2e5);
      expect(
        (await proxyAsV2_1.balanceOf(v2_2Upgrader.address)).toNumber()
      ).to.equal(0);

      // Transfer 0.2 FiatToken to the upgrader contract.
      await proxyAsV2_1.transfer(v2_2Upgrader.address, 2e5, { from: minter });
      expect((await proxyAsV2_1.balanceOf(minter)).toNumber()).to.equal(0);
      expect(
        (await proxyAsV2_1.balanceOf(v2_2Upgrader.address)).toNumber()
      ).to.equal(2e5);

      // Withdraw the FiatToken from the upgrader contract.
      await v2_2Upgrader.withdrawFiatToken({ from: upgraderOwner });
      expect((await proxyAsV2_1.balanceOf(upgraderOwner)).toNumber()).to.equal(
        2e5
      );
      expect(
        (await proxyAsV2_1.balanceOf(v2_2Upgrader.address)).toNumber()
      ).to.equal(0);

      // Cleanup - Burn 0.2 FiatToken.
      await proxyAsV2_1.transfer(minter, 2e5, { from: upgraderOwner });
      await proxyAsV2_1.burn(2e5, { from: minter });
    });
  });

  describe("upgrade", () => {
    it("upgrades, transfers proxy admin role to newProxyAdmin, runs tests, and self-destructs", async () => {
      // Transfer 0.2 FiatToken to the upgrader contract
      await proxyAsV2_1.configureMinter(minter, 2e5, {
        from: v2_1MasterMinter,
      });
      await proxyAsV2_1.mint(minter, 2e5, { from: minter });
      await proxyAsV2_1.transfer(v2_2Upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await fiatTokenProxy.changeAdmin(v2_2Upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call upgrade
      await v2_2Upgrader.upgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await fiatTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is updated to V2.2
      expect(await fiatTokenProxy.implementation()).to.equal(
        v2_2Implementation.address
      );

      // 0.2 FiatToken is transferred back to the upgraderOwner
      expect(
        (await proxyAsV2_2.balanceOf(v2_2Upgrader.address)).toNumber()
      ).to.equal(0);
      expect((await proxyAsV2_2.balanceOf(upgraderOwner)).toNumber()).to.equal(
        2e5
      );

      // token proxy contract is blacklisted
      expect(await proxyAsV2_2.isBlacklisted(proxyAsV2_2.address)).to.equal(
        true
      );

      // All accountsToBlacklist are still blacklisted
      const areAccountsBlacklisted = await Promise.all(
        accountsToBlacklist.map((account) => proxyAsV2_2.isBlacklisted(account))
      );
      expect(areAccountsBlacklisted.every((b: boolean) => b)).to.be.true;

      // mint works as expected
      await proxyAsV2_2.configureMinter(minter, 1000e6, {
        from: await proxyAsV2_2.masterMinter(),
      });
      expect((await proxyAsV2_2.minterAllowance(minter)).toNumber()).to.equal(
        1000e6
      );
      await proxyAsV2_2.mint(alice, 1000e6, { from: minter });
      expect((await proxyAsV2_2.balanceOf(alice)).toNumber()).to.equal(1000e6);
      expect((await proxyAsV2_2.minterAllowance(minter)).toNumber()).to.equal(
        0
      );

      await expectRevert(
        proxyAsV2_2.mint(alice, 1, { from: alice }),
        "caller is not a minter"
      );

      // transfer works as expected
      await proxyAsV2_2.transfer(bob, 200e6, { from: alice });
      expect((await proxyAsV2_2.balanceOf(alice)).toNumber()).to.equal(800e6);
      expect((await proxyAsV2_2.balanceOf(bob)).toNumber()).to.equal(200e6);

      await expectRevert(
        proxyAsV2_2.transfer(proxyAsV2_2.address, 1, { from: alice }),
        "account is blacklisted"
      );

      // approve/transferFrom work as expected
      await proxyAsV2_2.approve(bob, 250e6, { from: alice });
      expect((await proxyAsV2_2.allowance(alice, bob)).toNumber()).to.equal(
        250e6
      );
      await proxyAsV2_2.transferFrom(alice, bob, 250e6, { from: bob });
      expect((await proxyAsV2_2.allowance(alice, bob)).toNumber()).to.equal(0);
      expect((await proxyAsV2_2.balanceOf(alice)).toNumber()).to.equal(550e6);
      expect((await proxyAsV2_2.balanceOf(bob)).toNumber()).to.equal(450e6);

      // burn works as expected
      await proxyAsV2_2.transfer(minter, 100e6, { from: alice });
      expect((await proxyAsV2_2.balanceOf(minter)).toNumber()).to.equal(100e6);
      await proxyAsV2_2.burn(100e6, { from: minter });
      expect((await proxyAsV2_2.balanceOf(minter)).toNumber()).to.equal(0);

      await expectRevert(
        proxyAsV2_2.burn(1, { from: alice }),
        "caller is not a minter"
      );
    });

    it("reverts if there is an error", async () => {
      const _fiatTokenProxy = await FiatTokenProxy.new(
        v2_1Implementation.address,
        { from: originalProxyAdmin }
      );
      await initializeToVersion(_fiatTokenProxy, "2.1", minter, lostAndFound);
      const _proxyAsV2_1 = await FiatTokenV2_1.at(_fiatTokenProxy.address);

      const _v1_1Implementation = await FiatTokenV1_1.new();
      const upgraderOwner = accounts.deployerAccount;

      const _v2_2Upgrader = await V2_2Upgrader.new(
        _fiatTokenProxy.address,
        _v1_1Implementation.address, // provide V1.1 implementation instead of V2.2
        originalProxyAdmin,
        [],
        newSymbol,
        { from: upgraderOwner }
      );

      // Transfer 0.2 FiatToken to the contract
      await _proxyAsV2_1.configureMinter(minter, 2e5, {
        from: await _proxyAsV2_1.masterMinter(),
      });
      await _proxyAsV2_1.mint(minter, 2e5, { from: minter });
      await _proxyAsV2_1.transfer(_v2_2Upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await _fiatTokenProxy.changeAdmin(_v2_2Upgrader.address, {
        from: originalProxyAdmin,
      });

      // Upgrade should fail because initializeV2_2 function doesn't exist on V1.1
      await expectRevert(
        _v2_2Upgrader.upgrade({ from: upgraderOwner }),
        "revert"
      );

      // The proxy admin role is not transferred
      expect(await _fiatTokenProxy.admin()).to.equal(_v2_2Upgrader.address);

      // The implementation is left unchanged
      expect(await _fiatTokenProxy.implementation()).to.equal(
        v2_1Implementation.address
      );
    });

    it("reverts if blacklisting an account that was not blacklisted", async () => {
      const _fiatTokenProxy = await FiatTokenProxy.new(
        v2_1Implementation.address,
        { from: originalProxyAdmin }
      );
      await initializeToVersion(_fiatTokenProxy, "2.1", minter, lostAndFound);
      const _proxyAsV2_1 = await FiatTokenV2_1.at(_fiatTokenProxy.address);

      const _v2_2Implementation = await FiatTokenV2_2.new();
      const upgraderOwner = accounts.deployerAccount;

      // Try blacklisting an account that was not originally blacklisted.
      const accountsToBlacklist = generateAccounts(1);
      const _v2_2Upgrader = await V2_2Upgrader.new(
        _fiatTokenProxy.address,
        _v2_2Implementation.address,
        originalProxyAdmin,
        accountsToBlacklist,
        newSymbol,
        { from: upgraderOwner }
      );

      // Transfer 0.2 FiatToken to the contract
      await _proxyAsV2_1.configureMinter(minter, 2e5, {
        from: await _proxyAsV2_1.masterMinter(),
      });
      await _proxyAsV2_1.mint(minter, 2e5, { from: minter });
      await _proxyAsV2_1.transfer(_v2_2Upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await _fiatTokenProxy.changeAdmin(_v2_2Upgrader.address, {
        from: originalProxyAdmin,
      });

      // Upgrade should fail because the account to blacklist was not previously blacklisted.
      await expectRevert(
        _v2_2Upgrader.upgrade({ from: upgraderOwner }),
        "FiatTokenV2_2: Blacklisting previously unblacklisted account!"
      );

      // The proxy admin role is not transferred
      expect(await _fiatTokenProxy.admin()).to.equal(_v2_2Upgrader.address);

      // The implementation is left unchanged
      expect(await _fiatTokenProxy.implementation()).to.equal(
        v2_1Implementation.address
      );
    });

    describe("gas tests", () => {
      const gasTests: [number, number][] = [
        [100, BLOCK_GAS_LIMIT * 0.1],
        [500, BLOCK_GAS_LIMIT * 0.5],
      ];
      gasTests.forEach(([numAccounts, gasTarget]) => {
        it(`should not exceed ${gasTarget} gas when blacklisting ${numAccounts} accounts`, async () => {
          const accountsToBlacklist = generateAccounts(numAccounts);

          const _fiatTokenProxy = await FiatTokenProxy.new(
            v2_1Implementation.address,
            { from: originalProxyAdmin }
          );
          await initializeToVersion(
            _fiatTokenProxy,
            "2.1",
            minter,
            lostAndFound
          );
          const _proxyAsV2_1 = await FiatTokenV2_1.at(_fiatTokenProxy.address);

          // Blacklist the accounts in _deprecatedBlacklist first
          await Promise.all(
            accountsToBlacklist.map((a) =>
              _proxyAsV2_1.blacklist(a, { from: minter })
            )
          );

          // Set up the V2_2Upgrader
          const _v2_2Implementation = await FiatTokenV2_2.new();
          const upgraderOwner = accounts.deployerAccount;
          const _v2_2Upgrader = await V2_2Upgrader.new(
            _fiatTokenProxy.address,
            _v2_2Implementation.address,
            originalProxyAdmin,
            accountsToBlacklist,
            newSymbol,
            { from: upgraderOwner, gas: BLOCK_GAS_LIMIT }
          );

          // Transfer 0.2 FiatToken to the contract
          await _proxyAsV2_1.configureMinter(minter, 2e5, {
            from: await _proxyAsV2_1.masterMinter(),
          });
          await _proxyAsV2_1.mint(minter, 2e5, { from: minter });
          await _proxyAsV2_1.transfer(_v2_2Upgrader.address, 2e5, {
            from: minter,
          });

          // Transfer admin role to the contract
          await _fiatTokenProxy.changeAdmin(_v2_2Upgrader.address, {
            from: originalProxyAdmin,
          });

          // Perform the upgrade.
          const txReceipt = await _v2_2Upgrader.upgrade({
            from: upgraderOwner,
            gas: BLOCK_GAS_LIMIT,
          });
          const gasUsed = txReceipt.receipt.gasUsed;
          console.log({ numAccounts, gasUsed });
          expect(gasUsed).to.be.lessThan(gasTarget);

          // Sanity check that upgrade worked.
          expect(await _fiatTokenProxy.implementation()).to.equal(
            _v2_2Implementation.address
          );
        });
      });
    });
  });

  describe("abortUpgrade", () => {
    it("transfers proxy admin role to newProxyAdmin, and self-destructs", async () => {
      const _fiatTokenProxy = await FiatTokenProxy.new(
        v2_1Implementation.address,
        { from: originalProxyAdmin }
      );
      await initializeToVersion(_fiatTokenProxy, "2.1", minter, lostAndFound);

      const upgraderOwner = accounts.deployerAccount;
      const _v2_2Upgrader = await V2_2Upgrader.new(
        _fiatTokenProxy.address,
        v2_1Implementation.address,
        originalProxyAdmin,
        [],
        newSymbol,
        { from: upgraderOwner }
      );
      const _v2_2UpgraderHelperAddress = await _v2_2Upgrader.helper();

      // Transfer admin role to the contract
      await _fiatTokenProxy.changeAdmin(_v2_2Upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call abortUpgrade
      await _v2_2Upgrader.abortUpgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await _fiatTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is left unchanged
      expect(await _fiatTokenProxy.implementation()).to.equal(
        v2_1Implementation.address
      );

      // The upgrader contract is self-destructed.
      expect(await web3.eth.getCode(_v2_2Upgrader.address)).to.equal("0x");

      // The upgrader helper contract is self-destructed.
      expect(await web3.eth.getCode(_v2_2UpgraderHelperAddress)).to.equal("0x");
    });
  });
});
