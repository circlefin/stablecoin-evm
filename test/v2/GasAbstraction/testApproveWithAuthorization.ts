import crypto from "crypto";
import { FiatTokenV2Instance } from "../../../@types/generated";
import {
  AuthorizationUsed,
  Approval,
} from "../../../@types/generated/FiatTokenV2";
import {
  ACCOUNTS_AND_KEYS,
  MAX_UINT256,
  ZERO_ADDRESS,
} from "../../helpers/constants";
import { expectRevert, hexStringFromBuffer } from "../../helpers";
import {
  approveWithAuthorizationTypeHash,
  signApproveAuthorization,
  TestParams,
  signTransferAuthorization,
} from "./helpers";

export function testApproveWithAuthorization({
  getFiatToken,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
}: TestParams): void {
  describe("approveWithAuthorization", () => {
    let fiatToken: FiatTokenV2Instance;
    let domainSeparator: string;
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];
    let nonce: string;

    const initialBalance = 10e6;
    const approveParams = {
      owner: alice.address,
      spender: bob.address,
      value: 7e6,
      validAfter: 0,
      validBefore: MAX_UINT256,
    };

    beforeEach(async () => {
      fiatToken = getFiatToken();
      domainSeparator = getDomainSeparator();
      nonce = hexStringFromBuffer(crypto.randomBytes(32));
      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(approveParams.owner, initialBalance, {
        from: fiatTokenOwner,
      });
    });

    it("has the expected type hash", async () => {
      expect(await fiatToken.APPROVE_WITH_AUTHORIZATION_TYPEHASH()).to.equal(
        approveWithAuthorizationTypeHash
      );
    });

    it("grants allowance when a valid authorization is given", async () => {
      const { owner, spender, value, validAfter, validBefore } = approveParams;
      // create a signed authorization to grant Bob permission to spend
      // Alice's funds on behalf, and sign with Alice's key
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check that the allowance is initially zero
      expect((await fiatToken.allowance(owner, spender)).toNumber()).to.equal(
        0
      );

      // check that the authorization state is 0 = Unused
      expect(
        (await fiatToken.authorizationState(owner, nonce)).toNumber()
      ).to.equal(0);

      // a third-party, Charlie (not Alice) submits the authorization
      const result = await fiatToken.approveWithAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that allowance is updated
      expect((await fiatToken.allowance(owner, spender)).toNumber()).to.equal(
        value
      );

      // check that Approval event is emitted
      const log0 = result.logs[0] as Truffle.TransactionLog<Approval>;
      expect(log0.event).to.equal("Approval");
      expect(log0.args[0]).to.equal(owner);
      expect(log0.args[1]).to.equal(spender);
      expect(log0.args[2].toNumber()).to.equal(value);

      // check that AuthorizationUsed event is emitted
      const log1 = result.logs[1] as Truffle.TransactionLog<AuthorizationUsed>;
      expect(log1.event).to.equal("AuthorizationUsed");
      expect(log1.args[0]).to.equal(owner);
      expect(log1.args[1]).to.equal(nonce);

      // check that the authorization state is now 1 = Used
      expect(
        (await fiatToken.authorizationState(owner, nonce)).toNumber()
      ).to.equal(1);
    });

    it("reverts if the signature does not match given parameters", async () => {
      const { owner, spender, value, validAfter, validBefore } = approveParams;
      // create a signed authorization
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to cheat by claiming the approved amount is double
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value * 2, // pass incorrect value
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the signature is not signed with the right key", async () => {
      const { owner, spender, value, validAfter, validBefore } = approveParams;
      // create a signed authorization to grant Bob permission to spend
      // Alice's funds on behalf, but sign with Bob's key instead of Alice's
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        bob.key
      );

      // try to cheat by submitting the authorization that is signed by a
      // wrong person
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the authorization is not yet valid", async () => {
      const { owner, spender, value, validBefore } = approveParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validAfter = Math.floor(Date.now() / 1000) + 10;
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization early
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "authorization is not yet valid"
      );
    });

    it("reverts if the authorization is expired", async () => {
      const { owner, spender, value, validAfter } = approveParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validBefore = Math.floor(Date.now() / 1000);
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization that is expired
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "authorization is expired"
      );
    });

    it("reverts if the authorization has already been used", async () => {
      const { owner, spender, value, validAfter, validBefore } = approveParams;
      // create a signed authorization
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.approveWithAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // try to submit the authorization again
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization has a nonce that has already been used by the signer", async () => {
      const { owner, spender, value, validAfter, validBefore } = approveParams;
      // create a signed authorization
      const authorization = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.approveWithAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        authorization.v,
        authorization.r,
        authorization.s,
        { from: charlie }
      );

      // create another signed authorization with the same nonce, but
      // with different parameters
      const authorization2 = signApproveAuthorization(
        owner,
        spender,
        1e6,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization again
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          1e6,
          validAfter,
          validBefore,
          nonce,
          authorization2.v,
          authorization2.r,
          authorization2.s,
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization includes invalid approval parameters", async () => {
      const { owner, value, validAfter, validBefore } = approveParams;
      // create a signed authorization that attempts to grant allowance to the
      // zero address
      const spender = ZERO_ADDRESS;
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization with invalid approval parameters
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "approve to the zero address"
      );
    });

    it("reverts if the authorization is not for an approval", async () => {
      const {
        owner: from,
        spender: to,
        value,
        validAfter,
        validBefore,
      } = approveParams;
      // create a signed authorization for a transfer
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the transfer authorization
      await expectRevert(
        fiatToken.approveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the contract is paused", async () => {
      const { owner, spender, value, validAfter, validBefore } = approveParams;
      // create a signed authorization
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // pause the contract
      await fiatToken.pause({ from: fiatTokenOwner });

      // try to submit the authorization
      await expectRevert(
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "paused"
      );
    });

    it("reverts if the owner or the spender is blacklisted", async () => {
      const { owner, spender, value, validAfter, validBefore } = approveParams;
      // create a signed authorization
      const { v, r, s } = signApproveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // owner is blacklisted
      await fiatToken.blacklist(owner, { from: fiatTokenOwner });

      const submitTx = () =>
        fiatToken.approveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        );

      // try to submit the authorization
      await expectRevert(submitTx(), "account is blacklisted");

      // spender is blacklisted
      await fiatToken.unBlacklist(owner, { from: fiatTokenOwner });
      await fiatToken.blacklist(spender, { from: fiatTokenOwner });

      // try to submit the authorization
      await expectRevert(submitTx(), "account is blacklisted");
    });
  });
}
