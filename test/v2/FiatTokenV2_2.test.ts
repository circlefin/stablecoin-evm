import { FiatTokenV22Instance } from "../../@types/generated";
import { expectRevert } from "../helpers";
import { behavesLikeFiatTokenV2 } from "./FiatTokenV2.test";

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

contract("FiatTokenV2_2", (accounts) => {
  const fiatTokenOwner = accounts[9];
  let fiatToken: FiatTokenV22Instance;

  beforeEach(async () => {
    fiatToken = await FiatTokenV2_2.new();
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
    const [, , lostAndFound] = accounts;
    await fiatToken.initializeV2_1(lostAndFound);
    await fiatToken.initializeV2_2();
  });

  behavesLikeFiatTokenV2(accounts, () => fiatToken, fiatTokenOwner);

  describe("initializeV2_2", () => {
    const [, user, lostAndFound] = accounts;

    beforeEach(async () => {
    });

    it("disallows calling initializeV2_2 twice", async () => {
      await expectRevert(
        fiatToken.initializeV2_2()
      );
    });
  });
});
