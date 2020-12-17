import { behavesLikeRescuable } from "../v1.1/Rescuable.behavior";
import { FiatTokenV2Instance, RescuableInstance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { hasSafeAllowance } from "./safeAllowance.behavior";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import { makeDomainSeparator } from "./GasAbstraction/helpers";
import { expectRevert } from "../helpers";

const FiatTokenV2 = artifacts.require("FiatTokenV2");

contract("FiatTokenV2", (accounts) => {
  const fiatTokenOwner = accounts[9];
  let fiatToken: FiatTokenV2Instance;

  beforeEach(async () => {
    fiatToken = await FiatTokenV2.new();
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
});

export function behavesLikeFiatTokenV2(
  accounts: Truffle.Accounts,
  getFiatToken: () => FiatTokenV2Instance,
  fiatTokenOwner: string
): void {
  let domainSeparator: string;

  beforeEach(async () => {
    domainSeparator = makeDomainSeparator(
      "USD Coin",
      "2",
      1, // hardcoded to 1 because of ganache bug: https://github.com/trufflesuite/ganache/issues/1643
      getFiatToken().address
    );
  });

  behavesLikeRescuable(getFiatToken as () => RescuableInstance, accounts);

  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV2,
    version: 2,
    accounts,
  });

  it("has the expected domain separator", async () => {
    expect(await getFiatToken().DOMAIN_SEPARATOR()).to.equal(domainSeparator);
  });

  hasSafeAllowance(getFiatToken, fiatTokenOwner, accounts);

  hasGasAbstraction(
    getFiatToken,
    () => domainSeparator,
    fiatTokenOwner,
    accounts
  );

  it("disallows calling initializeV2 twice", async () => {
    // It was called once in beforeEach. Try to call again.
    await expectRevert(
      getFiatToken().initializeV2("Not USD Coin", { from: fiatTokenOwner })
    );
  });
}
