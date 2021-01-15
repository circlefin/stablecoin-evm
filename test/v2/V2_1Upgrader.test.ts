import {
  FiatTokenV2Instance,
  FiatTokenV21Instance,
  FiatTokenProxyInstance,
} from "../../@types/generated";
import { strip0x, expectRevert } from "../helpers";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const V2_1Upgrader = artifacts.require("V2_1Upgrader");

contract("V2_1Upgrader", (accounts) => {
  let fiatTokenProxy: FiatTokenProxyInstance;
  let proxyAsV2: FiatTokenV2Instance;
  let proxyAsV2_1: FiatTokenV21Instance;
  let v2Implementation: FiatTokenV2Instance;
  let v2_1Implementation: FiatTokenV21Instance;
  let originalProxyAdmin: string;
  const [minter, lostAndFound, alice, bob] = accounts.slice(9);

  before(async () => {
    fiatTokenProxy = await FiatTokenProxy.deployed();
    proxyAsV2 = await FiatTokenV2.at(fiatTokenProxy.address);
    proxyAsV2_1 = await FiatTokenV2_1.at(fiatTokenProxy.address);
    v2Implementation = await FiatTokenV2.deployed();
    v2_1Implementation = await FiatTokenV2_1.deployed();
    originalProxyAdmin = await fiatTokenProxy.admin();

    // Upgrade from v1 to v2
    await fiatTokenProxy.upgradeToAndCall(
      v2Implementation.address,
      web3.eth.abi.encodeFunctionSignature("initializeV2(string)") +
        strip0x(web3.eth.abi.encodeParameters(["string"], ["USD Coin"])),
      { from: originalProxyAdmin }
    );
  });

  beforeEach(async () => {
    await proxyAsV2.configureMinter(minter, 1000e6, {
      from: await proxyAsV2.masterMinter(),
    });
    await proxyAsV2.mint(minter, 100e6 + 2e5, { from: minter });
  });

  describe("upgrade", () => {
    it("upgrades, transfers proxy admin role to newProxyAdmin, runs tests, and self-destructs", async () => {
      // Run the test on the contracts deployed by Truffle to ensure the Truffle
      // migration is written correctly
      const upgrader = await V2_1Upgrader.deployed();
      const upgraderOwner = await upgrader.owner();

      expect(await upgrader.proxy()).to.equal(fiatTokenProxy.address);
      expect(await upgrader.implementation()).to.equal(
        v2_1Implementation.address
      );
      expect(await upgrader.helper()).not.to.be.empty;
      expect(await upgrader.newProxyAdmin()).to.equal(originalProxyAdmin);
      expect(await upgrader.lostAndFound()).to.equal(lostAndFound);

      // Transfer 0.2 USDC to the upgrader contract
      await proxyAsV2.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer 100 USDC to the FiatTokenProxy contract
      await proxyAsV2.transfer(proxyAsV2_1.address, 100e6, { from: minter });

      // Transfer admin role to the contract
      await fiatTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call upgrade
      await upgrader.upgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await fiatTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is updated to V2.1
      expect(await fiatTokenProxy.implementation()).to.equal(
        v2_1Implementation.address
      );

      // 0.2 USDC is transferred back to the upgraderOwner
      expect(
        (await proxyAsV2_1.balanceOf(upgrader.address)).toNumber()
      ).to.equal(0);
      expect((await proxyAsV2_1.balanceOf(upgraderOwner)).toNumber()).to.equal(
        2e5
      );

      // the USDC tokens held by the proxy contract are transferred to the lost
      // and found address
      expect(
        (await proxyAsV2_1.balanceOf(proxyAsV2_1.address)).toNumber()
      ).to.equal(0);

      expect((await proxyAsV2_1.balanceOf(lostAndFound)).toNumber()).to.equal(
        100e6
      );

      // token proxy contract is blacklisted
      expect(await proxyAsV2_1.isBlacklisted(proxyAsV2_1.address)).to.equal(
        true
      );

      // mint works as expected
      await proxyAsV2_1.configureMinter(minter, 1000e6, {
        from: await proxyAsV2_1.masterMinter(),
      });
      await proxyAsV2_1.mint(alice, 1000e6, { from: minter });
      expect((await proxyAsV2_1.balanceOf(alice)).toNumber()).to.equal(1000e6);

      await expectRevert(
        proxyAsV2_1.mint(alice, 1, { from: alice }),
        "caller is not a minter"
      );

      // transfer works as expected
      await proxyAsV2_1.transfer(bob, 200e6, { from: alice });
      expect((await proxyAsV2_1.balanceOf(alice)).toNumber()).to.equal(800e6);
      expect((await proxyAsV2_1.balanceOf(bob)).toNumber()).to.equal(200e6);

      await expectRevert(
        proxyAsV2_1.transfer(proxyAsV2_1.address, 1, { from: alice }),
        "account is blacklisted"
      );

      // approve/transferFrom work as expected
      await proxyAsV2_1.approve(bob, 250e6, { from: alice });
      expect((await proxyAsV2_1.allowance(alice, bob)).toNumber()).to.equal(
        250e6
      );
      await proxyAsV2_1.transferFrom(alice, bob, 250e6, { from: bob });
      expect((await proxyAsV2_1.allowance(alice, bob)).toNumber()).to.equal(0);
      expect((await proxyAsV2_1.balanceOf(alice)).toNumber()).to.equal(550e6);
      expect((await proxyAsV2_1.balanceOf(bob)).toNumber()).to.equal(450e6);

      await expectRevert(
        proxyAsV2_1.approve(proxyAsV2_1.address, 1, { from: alice }),
        "account is blacklisted"
      );

      // burn works as expected
      await proxyAsV2_1.transfer(minter, 100e6, { from: alice });
      expect((await proxyAsV2_1.balanceOf(minter)).toNumber()).to.equal(100e6);
      await proxyAsV2_1.burn(100e6, { from: minter });
      expect((await proxyAsV2_1.balanceOf(minter)).toNumber()).to.equal(0);

      await expectRevert(
        proxyAsV2_1.burn(1, { from: alice }),
        "caller is not a minter"
      );
    });

    it("reverts if there is an error", async () => {
      fiatTokenProxy = await FiatTokenProxy.new(v2Implementation.address, {
        from: originalProxyAdmin,
      });
      const fiatTokenV1_1 = await FiatTokenV1_1.new();
      const upgraderOwner = accounts[0];

      const upgrader = await V2_1Upgrader.new(
        fiatTokenProxy.address,
        fiatTokenV1_1.address, // provide V1.1 implementation instead of V2
        originalProxyAdmin,
        lostAndFound,
        { from: upgraderOwner }
      );

      // Transfer 0.2 USDC to the contract
      await proxyAsV2.transfer(upgrader.address, 2e5, { from: minter });

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
        v2Implementation.address
      );
    });
  });

  describe("abortUpgrade", () => {
    it("transfers proxy admin role to newProxyAdmin and self-destructs", async () => {
      fiatTokenProxy = await FiatTokenProxy.new(v2Implementation.address, {
        from: originalProxyAdmin,
      });
      const upgraderOwner = accounts[0];
      const upgrader = await V2_1Upgrader.new(
        fiatTokenProxy.address,
        v2_1Implementation.address,
        originalProxyAdmin,
        lostAndFound,
        { from: upgraderOwner }
      );

      // Transfer 0.2 USDC to the contract
      await proxyAsV2.transfer(upgrader.address, 2e5, { from: minter });

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
        v2Implementation.address
      );
    });
  });
});
