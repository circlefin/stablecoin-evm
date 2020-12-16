import crypto from "crypto";
import { FiatTokenV2Instance } from "../../../@types/generated";
import { ACCOUNTS_AND_KEYS, MAX_UINT256 } from "../../helpers/constants";
import { expectRevert, hexStringFromBuffer } from "../../helpers";
import {
  cancelAuthorizationTypeHash,
  signTransferAuthorization,
  signCancelAuthorization,
  TestParams,
} from "./helpers";

export function testCancelAuthorization({
  getFiatToken,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
}: TestParams): void {
  describe("cancelAuthorization", () => {
    let fiatToken: FiatTokenV2Instance;
    let domainSeparator: string;
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];
    let nonce: string;

    beforeEach(async () => {
      fiatToken = getFiatToken();
      domainSeparator = getDomainSeparator();
      nonce = hexStringFromBuffer(crypto.randomBytes(32));
      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(alice.address, 10e6, { from: fiatTokenOwner });
    });

    it("has the expected type hash", async () => {
      expect(await fiatToken.CANCEL_AUTHORIZATION_TYPEHASH()).to.equal(
        cancelAuthorizationTypeHash
      );
    });

    it("cancels unused transfer authorization if signature is valid", async () => {
      const from = alice.address;
      const to = bob.address;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256;

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
        cancellation.v,
        cancellation.r,
        cancellation.s,
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
          authorization.v,
          authorization.r,
          authorization.s,
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("cannot be used to cancel someone else's authorization", async () => {
      const from = alice.address;
      const to = bob.address;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256;

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
          cancellation.v,
          cancellation.r,
          cancellation.s,
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
        authorization.v,
        authorization.r,
        authorization.s,
        { from: charlie }
      );
    });

    it("reverts if the authorization has already been used", async () => {
      const from = alice.address;
      const to = bob.address;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256;

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
        authorization.v,
        authorization.r,
        authorization.s,
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
          cancellation.v,
          cancellation.r,
          cancellation.s,
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization has already been canceled", async () => {
      // create cancellation
      const cancellation = signCancelAuthorization(
        alice.address,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the cancellation
      await fiatToken.cancelAuthorization(
        alice.address,
        nonce,
        cancellation.v,
        cancellation.r,
        cancellation.s,
        { from: charlie }
      );

      // try to submit the same cancellation again
      await expectRevert(
        fiatToken.cancelAuthorization(
          alice.address,
          nonce,
          cancellation.v,
          cancellation.r,
          cancellation.s,
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the contract is paused", async () => {
      // create a cancellation
      const { v, r, s } = signCancelAuthorization(
        alice.address,
        nonce,
        domainSeparator,
        alice.key
      );

      // pause the contract
      await fiatToken.pause({ from: fiatTokenOwner });

      // try to submit the cancellation
      await expectRevert(
        fiatToken.cancelAuthorization(alice.address, nonce, v, r, s, {
          from: charlie,
        }),
        "paused"
      );
    });
  });
}
