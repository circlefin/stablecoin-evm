import { FiatTokenV21Instance } from "../../@types/generated";
import { expectRevert } from "../helpers";
import { behavesLikeFiatTokenV2 } from "./FiatTokenV2.test";

const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");

contract("FiatTokenV2_1", (accounts) => {
  const fiatTokenOwner = accounts[9];
  let fiatToken: FiatTokenV21Instance;

  beforeEach(async () => {
    fiatToken = await FiatTokenV2_1.new();
    await fiatToken.initialize(
      "USD Coin",
      "USDC",
      "USD",
      6,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner
    );
    await fiatToken.initializeV2("USD Coin", { from: fiatTokenOwner });
  });

  behavesLikeFiatTokenV2(accounts, () => fiatToken, fiatTokenOwner);

  describe("initializeV2_1", () => {
    const [, user, lostAndFound] = accounts;

    beforeEach(async () => {
      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(user, 100e6, { from: fiatTokenOwner });
    });

    it("transfers locked funds to a given address", async () => {
      // send tokens to the contract address
      await fiatToken.transfer(fiatToken.address, 100e6, { from: user });

      expect(
        (await fiatToken.balanceOf(fiatToken.address)).toNumber()
      ).to.equal(100e6);

      // initialize v2.1
      await fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner });

      expect(
        (await fiatToken.balanceOf(fiatToken.address)).toNumber()
      ).to.equal(0);

      expect((await fiatToken.balanceOf(lostAndFound)).toNumber()).to.equal(
        100e6
      );
    });

    it("blocks transfers to the contract address", async () => {
      await fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner });

      expect(await fiatToken.isBlacklisted(fiatToken.address)).to.equal(true);

      await expectRevert(
        fiatToken.transfer(fiatToken.address, 100e6, { from: user }),
        "account is blacklisted"
      );
    });

    it("disallows calling initializeV2_1 twice", async () => {
      await fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner });

      await expectRevert(
        fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner })
      );
    });
  });

  describe("version", () => {
    it("returns the version string", async () => {
      expect(await fiatToken.version()).to.equal("2");
    });
  });
});
