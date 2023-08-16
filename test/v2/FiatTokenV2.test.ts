import { behavesLikeRescuable } from "../v1.1/Rescuable.behavior";
import {
  MockErc1271WalletInstance,
  FiatTokenV2Instance,
  RescuableInstance,
} from "../../@types/generated";
import { AnyFiatTokenV2Instance } from "../../@types/AnyFiatTokenV2Instance";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { hasSafeAllowance } from "./safeAllowance.behavior";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import {
  SignatureBytesType,
  TestParams,
  WalletType,
  makeDomainSeparator,
} from "./GasAbstraction/helpers";
import { expectRevert } from "../helpers";
import { testTransferWithMultipleAuthorizations } from "./GasAbstraction/testTransferWithMultipleAuthorizations";

const FiatTokenV2 = artifacts.require("FiatTokenV2");
const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");

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
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV2,
    version: 2,
    accounts,
  });
});

export function behavesLikeFiatTokenV2(
  accounts: Truffle.Accounts,
  getFiatToken: () => AnyFiatTokenV2Instance,
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

  it("has the expected domain separator", async () => {
    expect(await getFiatToken().DOMAIN_SEPARATOR()).to.equal(domainSeparator);
  });

  hasSafeAllowance(getFiatToken, fiatTokenOwner, accounts);

  const testParams: TestParams = {
    getFiatToken,
    getDomainSeparator: () => domainSeparator,
    getERC1271Wallet,
    fiatTokenOwner,
    accounts,
    signerWalletType: WalletType.EOA,
    signatureBytesType: SignatureBytesType.Unpacked,
  };

  hasGasAbstraction(testParams);

  testTransferWithMultipleAuthorizations(testParams);

  it("disallows calling initializeV2 twice", async () => {
    // It was called once in beforeEach. Try to call again.
    await expectRevert(
      getFiatToken().initializeV2("Not USD Coin", { from: fiatTokenOwner })
    );
  });
}

export async function getERC1271Wallet(
  owner: string
): Promise<MockErc1271WalletInstance> {
  return await MockERC1271Wallet.new(owner);
}
