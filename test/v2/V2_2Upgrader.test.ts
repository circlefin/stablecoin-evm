import {
  FiatTokenProxyInstance,
  FiatTokenV21Instance,
  FiatTokenV22Instance,
} from "../../@types/generated";
import { expectRevert, strip0x } from "../helpers";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

contract("V2_2Upgrader", (accounts) => {
  let fiatTokenProxy: FiatTokenProxyInstance;
  let proxyAsV2_1: FiatTokenV21Instance;
  let proxyAsV2_2: FiatTokenV22Instance;
  let v2_1Implementation: FiatTokenV21Instance;
  let v2_2Implementation: FiatTokenV22Instance;
  let originalProxyAdmin: string;
  const [minter, lostAndFound, alice, bob] = accounts.slice(9);

  before(async () => {
    fiatTokenProxy = await FiatTokenProxy.deployed();
    proxyAsV2_1 = await FiatTokenV2_1.at(fiatTokenProxy.address);
    proxyAsV2_2 = await FiatTokenV2_2.at(fiatTokenProxy.address);
    v2_1Implementation = await FiatTokenV2_1.deployed();
    v2_2Implementation = await FiatTokenV2_2.deployed();
    originalProxyAdmin = await fiatTokenProxy.admin();

    // Upgrade from v1 to v2
    await fiatTokenProxy.upgradeToAndCall(
      v2_1Implementation.address,
      web3.eth.abi.encodeFunctionSignature("initializeV2(string)") +
        strip0x(web3.eth.abi.encodeParameters(["string"], ["USD Coin"])),
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
      const upgrader = await V2_2Upgrader.deployed();
      const upgraderOwner = await upgrader.owner();

      expect(await upgrader.proxy()).to.equal(fiatTokenProxy.address);
      expect(await upgrader.implementation()).to.equal(
        v2_2Implementation.address
      );
      expect(await upgrader.helper()).not.to.be.empty;
      expect(await upgrader.newProxyAdmin()).to.equal(originalProxyAdmin);

      // Transfer 0.2 USDC to the upgrader contract
      await proxyAsV2_1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer 100 USDC to the FiatTokenProxy contract
      await proxyAsV2_1.transfer(proxyAsV2_2.address, 100e6, { from: minter });

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
        v2_2Implementation.address
      );

      // 0.2 USDC is transferred back to the upgraderOwner
      expect(
        (await proxyAsV2_2.balanceOf(upgrader.address)).toNumber()
      ).to.equal(0);
      expect((await proxyAsV2_2.balanceOf(upgraderOwner)).toNumber()).to.equal(
        2e5
      );

      // the USDC tokens held by the proxy contract are transferred to the lost
      // and found address
      expect(
        (await proxyAsV2_2.balanceOf(proxyAsV2_2.address)).toNumber()
      ).to.equal(0);

      expect((await proxyAsV2_2.balanceOf(lostAndFound)).toNumber()).to.equal(
        100e6
      );

      // token proxy contract is blacklisted
      expect(await proxyAsV2_2.isBlacklisted(proxyAsV2_2.address)).to.equal(
        true
      );

      // mint works as expected
      await proxyAsV2_2.configureMinter(minter, 1000e6, {
        from: await proxyAsV2_2.masterMinter(),
      });
      await proxyAsV2_2.mint(alice, 1000e6, { from: minter });
      expect((await proxyAsV2_2.balanceOf(alice)).toNumber()).to.equal(1000e6);

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

      await expectRevert(
        proxyAsV2_2.approve(proxyAsV2_2.address, 1, { from: alice }),
        "account is blacklisted"
      );

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
      fiatTokenProxy = await FiatTokenProxy.new(v2_1Implementation.address, {
        from: originalProxyAdmin,
      });
      const fiatTokenV1_1 = await FiatTokenV1_1.new();
      const upgraderOwner = accounts[0];

      const upgrader = await V2_2Upgrader.new(
        fiatTokenProxy.address,
        fiatTokenV1_1.address, // provide V1.1 implementation instead of V2
        originalProxyAdmin,
        { from: upgraderOwner }
      );

      // Transfer 0.2 USDC to the contract
      await proxyAsV2_1.transfer(upgrader.address, 2e5, { from: minter });

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
      const upgrader = await V2_2Upgrader.new(
        fiatTokenProxy.address,
        v2_2Implementation.address,
        originalProxyAdmin,
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
