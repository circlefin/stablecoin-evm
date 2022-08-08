import BN from "bn.js";

import { FiatTokenV22Instance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { expectRevert } from "../helpers";
import { makeDomainSeparator } from "../v2/GasAbstraction/helpers";
import { MAX_UINT256 } from "../helpers/constants";
import { assert, expect } from "chai";

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

// 2^255 - 1 is the max token supply
const maxTotalSupply =
  "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const maxTotalSupplyBN = new BN(maxTotalSupply.slice(2), 16);
const maxUint256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

contract("FiatTokenV2_2", (accounts) => {
  const fiatTokenOwner = accounts[0];
  const blacklister = accounts[4];
  let fiatToken: FiatTokenV22Instance;
  const lostAndFound = accounts[2];
  const mintable = maxUint256;
  const infiniteAllower = accounts[10];
  const infiniteSpender = accounts[11];
  const blacklist1 = accounts[12];
  const blacklist2 = accounts[13];

  beforeEach(async () => {
    fiatToken = await FiatTokenV2_2.new();
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

  behavesLikeFiatTokenV2_2(
    accounts,
    () => fiatToken,
    fiatTokenOwner,
    infiniteAllower,
    infiniteSpender,
    [blacklist1, blacklist2]
  );
});

export function behavesLikeFiatTokenV2_2(
  accounts: Truffle.Accounts,
  getFiatToken: () => FiatTokenV2_2Instance,
  fiatTokenOwner: string,
  infiniteAllower: string,
  infiniteSpender: string,
  accountsToBlacklist: string[]
): void {
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV2_2,
    version: 3,
    accounts,
  });

  it("has the expected domain separator", async () => {
    await getFiatToken().initializeV2_2([], { from: fiatTokenOwner });
    const expectedDomainSeparator = makeDomainSeparator(
      "USD Coin",
      "2",
      1, // hardcoded to 1 because of ganache bug: https://github.com/trufflesuite/ganache/issues/1643
      getFiatToken().address
    );
    expect(await getFiatToken().DOMAIN_SEPARATOR()).to.equal(
      expectedDomainSeparator
    );
  });

  it("it allows user to set and remove an infinite allowance", async () => {
    await getFiatToken().initializeV2_2([], { from: fiatTokenOwner });
    const maxAllowanceBN = new BN(MAX_UINT256.slice(2), 16);
    const zeroBN = new BN(0);

    await getFiatToken().mint(infiniteAllower, 100e6, {
      from: fiatTokenOwner,
    });

    await getFiatToken().approve(infiniteSpender, MAX_UINT256, {
      from: infiniteAllower,
    });

    const allowanceAfterApprove = await getFiatToken().allowance(
      infiniteAllower,
      infiniteSpender
    );
    assert.isTrue(allowanceAfterApprove.eq(maxAllowanceBN));

    // spend allower's balance
    await getFiatToken().transferFrom(infiniteAllower, infiniteSpender, 50e6, {
      from: infiniteSpender,
    });

    const allowanceAfterSpend = await getFiatToken().allowance(
      infiniteAllower,
      infiniteSpender
    );
    assert.isTrue(allowanceAfterSpend.eq(maxAllowanceBN));

    // revoke approval
    await getFiatToken().approve(infiniteSpender, 0, { from: infiniteAllower });
    const allowanceAfterRevoke = await getFiatToken().allowance(
      infiniteAllower,
      infiniteSpender
    );
    assert.isTrue(allowanceAfterRevoke.eq(zeroBN));
  });

  it("allows minting up to the maximum total supply", async () => {
    await getFiatToken().initializeV2_2([], { from: fiatTokenOwner });

    await getFiatToken().mint(infiniteAllower, maxTotalSupply, {
      from: fiatTokenOwner,
    });

    assert.isTrue((await getFiatToken().totalSupply()).eq(maxTotalSupplyBN));
  });

  it("disallows minting beyond maximum total supply", async () => {
    await getFiatToken().initializeV2_2([], { from: fiatTokenOwner });

    // mint max total supply
    await getFiatToken().mint(infiniteAllower, maxTotalSupply, {
      from: fiatTokenOwner,
    });

    // minting one more should fail
    await expectRevert(
      getFiatToken().mint(infiniteAllower, 1, {
        from: fiatTokenOwner,
      }),
      "mint causes total supply to supply cap"
    );
  });

  it("disallows calling initializeV2_2 twice", async () => {
    await getFiatToken().initializeV2_2([], { from: fiatTokenOwner });

    await expectRevert(
      getFiatToken().initializeV2_2([], { from: fiatTokenOwner })
    );
  });

  it("blacklists accounts passed into initializeV2_2", async () => {
    await getFiatToken().initializeV2_2(accountsToBlacklist, {
      from: fiatTokenOwner,
    });

    for (const account of accountsToBlacklist) {
      expect(await getFiatToken().isBlacklisted(account)).to.eq(true);
    }
  });

  it("initializeV2_2 blacklists the contract address itself", async () => {
    await getFiatToken().initializeV2_2([], {
      from: fiatTokenOwner,
    });

    expect(await getFiatToken().isBlacklisted(getFiatToken().address)).to.eq(
      true
    );
  });
}
