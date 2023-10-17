import crypto from "crypto";
import { ACCOUNTS_AND_KEYS, MAX_UINT256_HEX } from "../../helpers/constants";
import { expectRevert, hexStringFromBuffer } from "../../helpers";
import {
  cancelAuthorizationTypeHash,
  signTransferAuthorization,
  signCancelAuthorization,
  TestParams,
  WalletType,
  prepareSignature,
} from "./helpers";
import { AnyFiatTokenV2Instance } from "../../../@types/AnyFiatTokenV2Instance";
import { MockErc1271WalletInstance } from "../../../@types/generated";

export function testCancelAuthorization({
  getFiatToken,
  getERC1271Wallet,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
  signerWalletType,
  signatureBytesType,
}: TestParams): void {
  describe(`cancelAuthorization with ${signerWalletType} wallet, ${signatureBytesType} signature interface`, async () => {
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];
    const nonce = hexStringFromBuffer(crypto.randomBytes(32));

    let fiatToken: AnyFiatTokenV2Instance;
    let aliceWallet: MockErc1271WalletInstance;
    let domainSeparator: string;

    let from: string;

    beforeEach(async () => {
      fiatToken = getFiatToken();
      aliceWallet = await getERC1271Wallet(alice.address);
      domainSeparator = getDomainSeparator();

      // Initialize `from` address either as Alice's EOA address or Alice's wallet address
      if (signerWalletType == WalletType.AA) {
        from = aliceWallet.address;
      } else {
        from = alice.address;
      }

      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(from, 10e6, {
        from: fiatTokenOwner,
      });
    });

    it("has the expected type hash", async () => {
      expect(await fiatToken.CANCEL_AUTHORIZATION_TYPEHASH()).to.equal(
        cancelAuthorizationTypeHash
      );
    });

    it("cancels unused transfer authorization if signature is valid", async () => {
      const to = bob.address;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256_HEX;

      // create a signed authorization
      const authorization = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // create cancellation
      const cancellation = signCancelAuthorization(
        from,
        nonce,
        domainSeparator,
        alice.key
      );

      // check that the authorization state is false
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(false);

      // cancel the authorization
      await fiatToken.cancelAuthorization(
        from,
        nonce,
        ...prepareSignature(cancellation, signatureBytesType),
        { from: charlie }
      );

      // check that the authorization state is now true
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(true);

      // attempt to use the canceled authorization
      await expectRevert(
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(authorization, signatureBytesType),
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("cannot be used to cancel someone else's authorization", async () => {
      const to = bob.address;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256_HEX;

      // create a signed authorization
      const authorization = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check that the authorization state is false
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(false);

      // create cancellation
      const cancellation = signCancelAuthorization(
        from,
        nonce,
        domainSeparator,
        bob.key
      );

      // cancel the authorization
      await expectRevert(
        fiatToken.cancelAuthorization(
          from,
          nonce,
          ...prepareSignature(cancellation, signatureBytesType),
          { from: charlie }
        ),
        "invalid signature"
      );

      // check that the authorization state is still false
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(false);

      // authorization should not have been canceled
      await fiatToken.transferWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        ...prepareSignature(authorization, signatureBytesType),
        { from: charlie }
      );
    });

    it("reverts if the authorization has already been used", async () => {
      const to = bob.address;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256_HEX;

      // create a signed authorization
      const authorization = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // use the authorization
      await fiatToken.transferWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        ...prepareSignature(authorization, signatureBytesType),
        { from: charlie }
      );

      // create cancellation
      const cancellation = signCancelAuthorization(
        from,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to cancel the authorization that's already used
      await expectRevert(
        fiatToken.cancelAuthorization(
          from,
          nonce,
          ...prepareSignature(cancellation, signatureBytesType),
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization has already been canceled", async () => {
      // create cancellation
      const cancellation = signCancelAuthorization(
        from,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the cancellation
      await fiatToken.cancelAuthorization(
        from,
        nonce,
        ...prepareSignature(cancellation, signatureBytesType),
        { from: charlie }
      );

      // try to submit the same cancellation again
      await expectRevert(
        fiatToken.cancelAuthorization(
          from,
          nonce,
          ...prepareSignature(cancellation, signatureBytesType),
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the contract is paused", async () => {
      // create a cancellation
      const cancellation = signCancelAuthorization(
        from,
        nonce,
        domainSeparator,
        alice.key
      );

      // pause the contract
      await fiatToken.pause({ from: fiatTokenOwner });

      // try to submit the cancellation
      await expectRevert(
        fiatToken.cancelAuthorization(
          from,
          nonce,
          ...prepareSignature(cancellation, signatureBytesType),

          {
            from: charlie,
          }
        ),
        "paused"
      );
    });
  });
}
