import { FiatTokenV22Instance } from "../../@types/generated";
import { expectRevert, initializeToVersion } from "../helpers";
import { behavesLikeFiatTokenV2 } from "./FiatTokenV2.test";

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

contract("FiatTokenV2_2", (accounts) => {
  const fiatTokenOwner = accounts[9];
  const [, , lostAndFound] = accounts;
  let fiatToken: FiatTokenV22Instance;

  beforeEach(async () => {
    fiatToken = await FiatTokenV2_2.new();
    await initializeToVersion(fiatToken, "2.2", fiatTokenOwner, lostAndFound);
  });

  behavesLikeFiatTokenV2(accounts, () => fiatToken, fiatTokenOwner);

  describe("initializeV2_2", () => {
    it("disallows calling initializeV2_2 twice", async () => {
      await expectRevert(fiatToken.initializeV2_2());
    });
  });
});
