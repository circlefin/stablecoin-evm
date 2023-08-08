import {
  AnyFiatTokenV2Instance,
  FiatTokenV22InstanceExtended,
} from "../../@types/AnyFiatTokenV2Instance";
import { expectRevert, initializeToVersion } from "../helpers";
import { behavesLikeFiatTokenV2, getERC1271Wallet } from "./FiatTokenV2.test";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import {
  SignatureBytesType,
  WalletType,
  makeDomainSeparator,
  permitSignature,
  permitSignatureV22,
  transferWithAuthorizationSignature,
  transferWithAuthorizationSignatureV22,
  cancelAuthorizationSignature,
  cancelAuthorizationSignatureV22,
  receiveWithAuthorizationSignature,
  receiveWithAuthorizationSignatureV22,
} from "./GasAbstraction/helpers";

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

contract("FiatTokenV2_2", (accounts) => {
  const fiatTokenOwner = accounts[9];
  let fiatToken: FiatTokenV22InstanceExtended;

  const getFiatToken = (
    signatureBytesType: SignatureBytesType
  ): (() => AnyFiatTokenV2Instance) => {
    return () => {
      initializeOverloadedMethods(fiatToken, signatureBytesType);
      return fiatToken;
    };
  };

  beforeEach(async () => {
    const [, , lostAndFound] = accounts;

    fiatToken = await FiatTokenV2_2.new();
    await initializeToVersion(fiatToken, "2.2", fiatTokenOwner, lostAndFound);
  });

  behavesLikeFiatTokenV2(
    accounts,
    getFiatToken(SignatureBytesType.Unpacked),
    fiatTokenOwner
  );

  behavesLikeFiatTokenV22(
    accounts,
    getFiatToken(SignatureBytesType.Packed),
    fiatTokenOwner
  );
});

export function behavesLikeFiatTokenV22(
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

  const v22TestParams = {
    getFiatToken,
    getDomainSeparator: () => domainSeparator,
    getERC1271Wallet,
    fiatTokenOwner,
    accounts,
  };

  // Test gas abstraction funtionalities with both EOA and AA wallets
  hasGasAbstraction({
    ...v22TestParams,
    signerWalletType: WalletType.EOA,
    signatureBytesType: SignatureBytesType.Packed,
  });
  hasGasAbstraction({
    ...v22TestParams,
    signerWalletType: WalletType.AA,
    signatureBytesType: SignatureBytesType.Packed,
  });

  describe("initializeV2_2", () => {
    it("disallows calling initializeV2_2 twice", async () => {
      await expectRevert(
        (getFiatToken() as FiatTokenV22InstanceExtended).initializeV2_2()
      );
    });
  });
}

/**
 * With v2.2 we introduce overloaded functions for `permit`,
 * `transferWithAuthorization`, `receiveWithAuthorization`,
 * and `cancelAuthorization`.
 *
 * Since function overloading isn't supported by Javascript,
 * the typechain library generates type interfaces for overloaded functions differently.
 * For instance, we can no longer access the `permit` function with
 * `fiattoken.permit`. Instead, we need to need to use the full function signature e.g.
 * `fiattoken.methods["permit(address,address,uint256,uint256,uint8,bytes32,bytes32)"]` OR
 * `fiattoken.methods["permit(address,address,uint256,uint256,bytes)"]` (v22 interface).
 *
 * To preserve type-coherence and reuse test suites written for v2 & v2.1 contracts,
 * here we re-assign the overloaded method definition to the method name shorthand.
 */
export function initializeOverloadedMethods(
  fiatToken: FiatTokenV22InstanceExtended,
  signatureBytesType: SignatureBytesType
): void {
  if (signatureBytesType == SignatureBytesType.Unpacked) {
    fiatToken.permit = fiatToken.methods[permitSignature];
    fiatToken.transferWithAuthorization =
      fiatToken.methods[transferWithAuthorizationSignature];
    fiatToken.receiveWithAuthorization =
      fiatToken.methods[receiveWithAuthorizationSignature];
    fiatToken.cancelAuthorization =
      fiatToken.methods[cancelAuthorizationSignature];
  } else {
    fiatToken.permit = fiatToken.methods[permitSignatureV22];
    fiatToken.transferWithAuthorization =
      fiatToken.methods[transferWithAuthorizationSignatureV22];
    fiatToken.receiveWithAuthorization =
      fiatToken.methods[receiveWithAuthorizationSignatureV22];
    fiatToken.cancelAuthorization =
      fiatToken.methods[cancelAuthorizationSignatureV22];
  }
}
