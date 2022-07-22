import BN from "bn.js";
import {
  FiatTokenV2Instance,
  FiatTokenV21Instance,
  FiatTokenV3Instance,
  FiatTokenProxyInstance,
} from "../../@types/generated";
import { expectRevert, strip0x } from "../helpers";
import { MAX_UINT256 } from "../helpers/constants";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV3 = artifacts.require("FiatTokenV3");
const V3Upgrader = artifacts.require("V3Upgrader");

const DEV_ACCOUNTS_TO_BLACKLIST = [
  "0xAa05F7C7eb9AF63D6cC03C36c4f4Ef6c37431EE0",
  "0x7F367cC41522cE07553e823bf3be79A889DEbe1B",
];

contract("V3Upgrader", (accounts) => {
  let fiatTokenProxy: FiatTokenProxyInstance;
  let proxyAsV2_1: FiatTokenV21Instance;
  let proxyAsV3: FiatTokenV3Instance;
  let v2Implementation: FiatTokenV2Instance;
  let v2_1Implementation: FiatTokenV21Instance;
  let v3Implementation: FiatTokenV3Instance;
  let originalProxyAdmin: string;
  const [minter, alice, bob] = accounts.slice(9);

  before(async () => {
    fiatTokenProxy = await FiatTokenProxy.deployed();
    proxyAsV2_1 = await FiatTokenV2_1.at(fiatTokenProxy.address);
    proxyAsV3 = await FiatTokenV3.at(fiatTokenProxy.address);
    v2Implementation = await FiatTokenV2.deployed();
    v2_1Implementation = await FiatTokenV2_1.deployed();
    v3Implementation = await FiatTokenV3.deployed();
    originalProxyAdmin = await fiatTokenProxy.admin();

    // Upgrade from v1 to v2
    await fiatTokenProxy.upgradeToAndCall(
      v2Implementation.address,
      web3.eth.abi.encodeFunctionSignature("initializeV2(string)") +
        strip0x(web3.eth.abi.encodeParameters(["string"], ["USD Coin"])),
      { from: originalProxyAdmin }
    );

    // Upgrade from v2 to v2.1
    await fiatTokenProxy.upgradeToAndCall(
      v2_1Implementation.address,
      web3.eth.abi.encodeFunctionSignature("initializeV2_1(address)") +
        strip0x(
          web3.eth.abi.encodeParameters(["address"], [originalProxyAdmin])
        ),
      { from: originalProxyAdmin }
    );
  });

  beforeEach(async () => {
    await proxyAsV2_1.configureMinter(minter, 1000e6, {
      from: await proxyAsV2_1.masterMinter(),
    });
    await proxyAsV2_1.mint(minter, 100e6 + 2e5, { from: minter });
  });

  describe("upgrade", () => {
    it("upgrades, transfers proxy admin role to newProxyAdmin, runs tests, and self-destructs", async () => {
      // Run the test on the contracts deployed by Truffle to ensure the Truffle
      // migration is written correctly
      const upgrader = await V3Upgrader.deployed();
      const upgraderOwner = await upgrader.owner();

      expect(await upgrader.proxy()).to.equal(fiatTokenProxy.address);
      expect(await upgrader.implementation()).to.equal(
        v3Implementation.address
      );
      expect(await upgrader.helper()).not.to.be.empty;
      expect(await upgrader.newProxyAdmin()).to.equal(originalProxyAdmin);
      expect(await upgrader.accountsToBlacklist()).to.deep.equal(
        DEV_ACCOUNTS_TO_BLACKLIST
      );

      // Transfer 0.2 USDC to the contract
      await proxyAsV3.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await fiatTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call upgrade
      await upgrader.upgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await fiatTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is updated to V3
      expect(await fiatTokenProxy.implementation()).to.equal(
        v3Implementation.address
      );

      // mint works as expected
      await proxyAsV3.configureMinter(minter, 1000e6, {
        from: await proxyAsV3.masterMinter(),
      });
      await proxyAsV3.mint(alice, 1000e6, { from: minter });
      expect((await proxyAsV3.balanceOf(alice)).toNumber()).to.equal(1000e6);

      await expectRevert(
        proxyAsV3.mint(alice, 1, { from: alice }),
        "caller is not a minter"
      );

      // transfer works as expected
      await proxyAsV3.transfer(bob, 200e6, { from: alice });
      expect((await proxyAsV3.balanceOf(alice)).toNumber()).to.equal(800e6);
      expect((await proxyAsV3.balanceOf(bob)).toNumber()).to.equal(200e6);

      // infinite allowance work as expected
      const maxAllowanceBN = new BN(MAX_UINT256.slice(2), 16);
      await proxyAsV3.approve(bob, MAX_UINT256, { from: alice });
      assert.isTrue((await proxyAsV3.allowance(alice, bob)).eq(maxAllowanceBN));
      await proxyAsV3.transferFrom(alice, bob, 250e6, { from: bob });
      assert.isTrue((await proxyAsV3.allowance(alice, bob)).eq(maxAllowanceBN));
      expect((await proxyAsV3.balanceOf(alice)).toNumber()).to.equal(550e6);
      expect((await proxyAsV3.balanceOf(bob)).toNumber()).to.equal(450e6);

      // normal transferFrom works as expected
      await proxyAsV3.approve(bob, 100e6, { from: alice });
      expect((await proxyAsV3.allowance(alice, bob)).toNumber()).to.equal(
        100e6
      );
      await proxyAsV3.transferFrom(alice, bob, 100e6, { from: bob });
      expect((await proxyAsV3.allowance(alice, bob)).toNumber()).to.equal(0);
      expect((await proxyAsV3.balanceOf(alice)).toNumber()).to.equal(450e6);
      expect((await proxyAsV3.balanceOf(bob)).toNumber()).to.equal(550e6);

      // Input accounts + proxy address itself are blacklisted'
      const fiatProxyAddress = fiatTokenProxy.address;
      const DEV_ACCOUNTS_TO_BLACKLIST_PLUS_FIAT_PROXY = [
        ...DEV_ACCOUNTS_TO_BLACKLIST,
        fiatProxyAddress,
      ];
      for (const account of DEV_ACCOUNTS_TO_BLACKLIST_PLUS_FIAT_PROXY) {
        expect(await proxyAsV3.isBlacklisted(account)).to.equal(true);
        await expectRevert(
          proxyAsV3.mint(account, 1, { from: minter }),
          "Blacklistable: account is blacklisted."
        );
        await expectRevert(
          proxyAsV3.transfer(account, 1, { from: alice }),
          "Blacklistable: account is blacklisted."
        );
        await expectRevert(
          proxyAsV3.approve(account, 1, { from: alice }),
          "Blacklistable: account is blacklisted."
        );
      }

      // blacklisting functionality still works
      // blacklisted accounts can't transfer funds out
      const blacklister = await proxyAsV3.blacklister();
      await proxyAsV3.blacklist(alice, { from: blacklister });
      expect(await proxyAsV3.isBlacklisted(alice)).to.equal(true);
      await expectRevert(
        proxyAsV3.transfer(bob, 1, { from: alice }),
        "Blacklistable: account is blacklisted."
      );
      await proxyAsV3.unBlacklist(alice, { from: blacklister });
      expect(await proxyAsV3.isBlacklisted(alice)).to.equal(false);

      // burn works as expected
      await proxyAsV3.transfer(minter, 100e6, { from: alice });
      expect((await proxyAsV3.balanceOf(minter)).toNumber()).to.equal(200e6);
      await proxyAsV3.burn(200e6, { from: minter });
      expect((await proxyAsV3.balanceOf(minter)).toNumber()).to.equal(0);

      await expectRevert(
        proxyAsV3.burn(1, { from: alice }),
        "caller is not a minter"
      );
    });

    it("reverts if there is an error", async () => {
      fiatTokenProxy = await FiatTokenProxy.new(v2_1Implementation.address, {
        from: originalProxyAdmin,
      });
      const fiatTokenV2_1 = await FiatTokenV2_1.new();
      const upgraderOwner = accounts[0];

      const upgrader = await V3Upgrader.new(
        fiatTokenProxy.address,
        fiatTokenV2_1.address, // provide V2.1 implementation instead of V3
        originalProxyAdmin,
        DEV_ACCOUNTS_TO_BLACKLIST,
        { from: upgraderOwner }
      );

      // Transfer 0.2 USDC to the contract
      await proxyAsV2_1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await fiatTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Upgrade should fail because initializeV3 function doesn't exist on implementation
      await expectRevert(upgrader.upgrade({ from: upgraderOwner }), "revert");

      // The proxy admin role is not transferred
      expect(await fiatTokenProxy.admin()).to.equal(upgrader.address);

      // The implementation is left unchanged
      expect(await fiatTokenProxy.implementation()).to.equal(
        v2_1Implementation.address
      );
    });
  });

  describe("abortUpgrade", () => {
    it("transfers proxy admin role to newProxyAdmin and self-destructs", async () => {
      fiatTokenProxy = await FiatTokenProxy.new(v2_1Implementation.address, {
        from: originalProxyAdmin,
      });
      const upgraderOwner = accounts[0];
      const upgrader = await V3Upgrader.new(
        fiatTokenProxy.address,
        v3Implementation.address,
        originalProxyAdmin,
        DEV_ACCOUNTS_TO_BLACKLIST,
        { from: upgraderOwner }
      );

      // Transfer 0.2 USDC to the contract
      await proxyAsV2_1.transfer(upgrader.address, 2e5, { from: minter });

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
        v2_1Implementation.address
      );
    });
  });
});
