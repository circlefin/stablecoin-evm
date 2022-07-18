import BN from "bn.js";

import { FiatTokenV3Instance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { expectRevert } from "../helpers";
import { makeDomainSeparator } from "../v2/GasAbstraction/helpers";
import { MAX_UINT256 } from "../helpers/constants";
import { assert, expect } from "chai";

const FiatTokenV3 = artifacts.require("FiatTokenV3");

contract("FiatTokenV3", (accounts) => {
  const fiatTokenOwner = accounts[0];
  const blacklister = accounts[4];
  let fiatToken: FiatTokenV3Instance;
  const lostAndFound = accounts[2];
  const mintable = 1000000e6;
  const infiniteAllower = accounts[10];
  const infiniteSpender = accounts[11];
  const blacklist1 = accounts[12];
  const blacklist2 = accounts[13];

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

    await fiatToken.configureMinter(fiatTokenOwner, mintable, {
      from: fiatTokenOwner,
    });
  });

  behavesLikeFiatTokenV3(
    accounts,
    () => fiatToken,
    fiatTokenOwner,
    infiniteAllower,
    infiniteSpender,
    [blacklist1, blacklist2]
  );
});

export function behavesLikeFiatTokenV3(
  accounts: Truffle.Accounts,
  getFiatToken: () => FiatTokenV3Instance,
  fiatTokenOwner: string,
  infiniteAllower: string,
  infiniteSpender: string,
  accountsToBlacklist: string[]
): void {
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV3,
    version: 3,
    accounts,
  });

  it("has the expected domain separator", async () => {
    await getFiatToken().initializeV3([], { from: fiatTokenOwner });
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

  it("it allows user to set and remove an infinite allowance", async () => {
    await getFiatToken().initializeV3([], { from: fiatTokenOwner });
    const maxAllowanceBN = new BN(MAX_UINT256.slice(2), 16);
    const zeroBN = new BN(0);

    await getFiatToken().mint(infiniteAllower, 100e6, {
      from: fiatTokenOwner,
    });

    await getFiatToken().approve(infiniteSpender, MAX_UINT256, {
      from: infiniteAllower,
    });

    // spend allower's balance
    await getFiatToken().transferFrom(infiniteAllower, infiniteSpender, 50e6, {
      from: infiniteSpender,
    });

    const allowance1 = await getFiatToken().allowance(
      infiniteAllower,
      infiniteSpender
    );
    assert.isTrue(allowance1.eq(maxAllowanceBN));

    // revoke approval
    await getFiatToken().approve(infiniteSpender, 0, { from: infiniteAllower });
    const allowance2 = await getFiatToken().allowance(
      infiniteAllower,
      infiniteSpender
    );
    assert.isTrue(allowance2.eq(zeroBN));
  });

  it("disallows calling initializeV3 twice", async () => {
    await getFiatToken().initializeV3([], { from: fiatTokenOwner });

    await expectRevert(
      getFiatToken().initializeV3([], { from: fiatTokenOwner })
    );
  });

  it("blacklists accounts passed into initializeV3", async () => {
    await getFiatToken().initializeV3(accountsToBlacklist, {
      from: fiatTokenOwner,
    });

    for (const account of accountsToBlacklist) {
      expect(await getFiatToken().isBlacklisted(account)).to.eq(true);
    }
  });

  it("initializeV3 blacklists the contract address itself", async () => {
    await getFiatToken().initializeV3([], {
      from: fiatTokenOwner,
    });

    expect(await getFiatToken().isBlacklisted(getFiatToken().address)).to.eq(
      true
    );
  });
}
