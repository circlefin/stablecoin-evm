import { FiatTokenV3Instance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { expectRevert } from "../helpers";
import { makeDomainSeparator } from "../v2/GasAbstraction/helpers";
import { checkFreezeEvents, checkUnfreezeEvents } from "./utils";

const FiatTokenV3 = artifacts.require("FiatTokenV3");

contract("FiatTokenV3", (accounts) => {
  const fiatTokenOwner = accounts[0];
  const blacklister = accounts[4];
  const sketchyUser = accounts[10];
  let fiatToken: FiatTokenV3Instance;
  const lostAndFound = accounts[2];
  const sketchyBalance = 32e6;
  const mintable = 1000000e6;

  beforeEach(async () => {
    fiatToken = await FiatTokenV3.new();
    await fiatToken.initialize(
      "USD Coin",
      "USDC",
      "USD",
      6,
      fiatTokenOwner,
      fiatTokenOwner,
      blacklister,
      fiatTokenOwner
    );
    await fiatToken.initializeV2("USD Coin", { from: fiatTokenOwner });
    await fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner });
    await fiatToken.initializeV3({ from: fiatTokenOwner });

    await fiatToken.configureMinter(fiatTokenOwner, mintable, {
      from: fiatTokenOwner,
    });
    await fiatToken.mint(sketchyUser, sketchyBalance, { from: fiatTokenOwner });
  });

  behavesLikeFiatTokenV3(
    accounts,
    () => fiatToken,
    fiatTokenOwner,
    blacklister,
    sketchyUser,
    sketchyBalance
  );
});

export function behavesLikeFiatTokenV3(
  accounts: Truffle.Accounts,
  getFiatToken: () => FiatTokenV3Instance,
  fiatTokenOwner: string,
  blacklister: string,
  sketchyUser: string,
  sketchyBalance: number
): void {
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV3,
    version: 3,
    accounts,
  });

  it("has the expected domain separator", async () => {
    const expectedDomainSeparator = makeDomainSeparator(
      "USD Coin",
      "3",
      1, // hardcoded to 1 because of ganache bug: https://github.com/trufflesuite/ganache/issues/1643
      getFiatToken().address
    );
    expect(await getFiatToken().DOMAIN_SEPARATOR()).to.equal(
      expectedDomainSeparator
    );
  });

  it("allows the blacklister to freeze and unfreeze an account", async () => {
    const freezing = await getFiatToken().freezeBalance(sketchyUser, {
      from: blacklister,
    });
    checkFreezeEvents(freezing, sketchyBalance, sketchyUser);

    expect((await getFiatToken().balanceOf(sketchyUser)).toNumber()).to.equal(
      0
    );
    expect(
      (await getFiatToken().frozenBalanceOf(sketchyUser)).toNumber()
    ).to.equal(sketchyBalance);

    const unfreezing = await getFiatToken().unfreezeBalance(sketchyUser, {
      from: blacklister,
    });
    checkUnfreezeEvents(unfreezing, sketchyBalance, sketchyUser);

    expect((await getFiatToken().balanceOf(sketchyUser)).toNumber()).to.equal(
      sketchyBalance
    );
    expect(
      (await getFiatToken().frozenBalanceOf(sketchyUser)).toNumber()
    ).to.equal(0);
  });

  it("forbids a non-blacklister from freezing or unfreezing an account", async () => {
    await expectRevert(
      getFiatToken().freezeBalance(sketchyUser, { from: fiatTokenOwner })
    );
    expect((await getFiatToken().balanceOf(sketchyUser)).toNumber()).to.equal(
      sketchyBalance
    );
    expect(
      (await getFiatToken().frozenBalanceOf(sketchyUser)).toNumber()
    ).to.equal(0);

    await getFiatToken().freezeBalance(sketchyUser, { from: blacklister });

    await expectRevert(
      getFiatToken().unfreezeBalance(sketchyUser, { from: fiatTokenOwner })
    );

    expect((await getFiatToken().balanceOf(sketchyUser)).toNumber()).to.equal(
      0
    );
    expect(
      (await getFiatToken().frozenBalanceOf(sketchyUser)).toNumber()
    ).to.equal(sketchyBalance);

    await getFiatToken().unfreezeBalance(sketchyUser, { from: blacklister });
  });

  it("adds/subtracts unfrozen/frozen amounts from total supply", async () => {
    expect((await getFiatToken().totalSupply()).toNumber()).to.equal(
      sketchyBalance
    );

    await getFiatToken().freezeBalance(sketchyUser, { from: blacklister });

    expect((await getFiatToken().totalSupply()).toNumber()).to.equal(0);

    await getFiatToken().unfreezeBalance(sketchyUser, { from: blacklister });

    expect((await getFiatToken().totalSupply()).toNumber()).to.equal(
      sketchyBalance
    );
  });

  it("disallows calling initializeV3 twice", async () => {
    // It was called once in beforeEach. Try to call again.
    await expectRevert(getFiatToken().initializeV3({ from: fiatTokenOwner }));
  });
}
