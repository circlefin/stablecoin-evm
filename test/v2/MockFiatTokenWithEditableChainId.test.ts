import { MockFiatTokenWithEditableChainIdInstance } from "../../@types/generated";
import { makeDomainSeparator } from "../helpers";

const SignatureChecker = artifacts.require("SignatureChecker");
const MockFiatTokenWithEditableChainId = artifacts.require(
  "MockFiatTokenWithEditableChainId"
);

contract("MockFiatTokenWithEditableChainId", (accounts) => {
  const fiatTokenOwner = accounts[9];
  let fiatToken: MockFiatTokenWithEditableChainIdInstance;

  const name = "USD Coin";
  const version = "2";

  beforeEach(async () => {
    await SignatureChecker.new();
    MockFiatTokenWithEditableChainId.link(SignatureChecker);
    fiatToken = await MockFiatTokenWithEditableChainId.new();

    await fiatToken.initialize(
      name,
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
    await fiatToken.initializeV2_2([]);
  });

  describe("DOMAIN_SEPARATOR", () => {
    it("domain separator gets recalculated after chain ID changes", async () => {
      const chainId: number = (await fiatToken.chainId()).toNumber();
      const originalDomainSeparator: string = await fiatToken.DOMAIN_SEPARATOR();
      assert.equal(
        originalDomainSeparator,
        makeDomainSeparator(name, version, chainId, fiatToken.address)
      );

      const newChainId = 1234;
      await fiatToken.setChainId(newChainId);

      const newDomainSeparator: string = await fiatToken.DOMAIN_SEPARATOR();

      assert.equal(
        newDomainSeparator,
        makeDomainSeparator(name, version, newChainId, fiatToken.address)
      );
    });
  });
});
