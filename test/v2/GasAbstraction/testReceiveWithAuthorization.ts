import crypto from "crypto";
import { FiatTokenV2Instance } from "../../../@types/generated";
import {
  AuthorizationUsed,
  Transfer,
} from "../../../@types/generated/FiatTokenV2";
import { ACCOUNTS_AND_KEYS, MAX_UINT256 } from "../../helpers/constants";
import { expectRevert, hexStringFromBuffer } from "../../helpers";
import {
  receiveWithAuthorizationTypeHash,
  signReceiveAuthorization,
  TestParams,
} from "./helpers";

export function testReceiveWithAuthorization({
  getFiatToken,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
}: TestParams): void {
  describe("receiveWithAuthorization", () => {
    let fiatToken: FiatTokenV2Instance;
    let domainSeparator: string;
    const [alice, charlie] = ACCOUNTS_AND_KEYS;
    const [, bob, david] = accounts;
    let nonce: string;

    const initialBalance = 10e6;
    const receiveParams = {
      from: alice.address,
      to: bob,
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
      await fiatToken.mint(receiveParams.from, initialBalance, {
        from: fiatTokenOwner,
      });
    });

    it("has the expected type hash", async () => {
      expect(await fiatToken.RECEIVE_WITH_AUTHORIZATION_TYPEHASH()).to.equal(
        receiveWithAuthorizationTypeHash
      );
    });

    it("executes a transfer when a valid authorization is given and the caller is the payee", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create an authorization to transfer money from Alice to Bob and sign
      // with Alice's key
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check initial balance
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(10e6);
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(0);

      // check that the authorization state is false
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(false);

      // The recipient (Bob) submits the signed authorization
      const result = await fiatToken.receiveWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: bob }
      );

      // check that balance is updated
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(
        initialBalance - value
      );
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(value);

      // check that AuthorizationUsed event is emitted
      const log0 = result.logs[0] as Truffle.TransactionLog<AuthorizationUsed>;
      expect(log0.event).to.equal("AuthorizationUsed");
      expect(log0.args[0]).to.equal(from);
      expect(log0.args[1]).to.equal(nonce);

      // check that Transfer event is emitted
      const log1 = result.logs[1] as Truffle.TransactionLog<Transfer>;
      expect(log1.event).to.equal("Transfer");
      expect(log1.args[0]).to.equal(from);
      expect(log1.args[1]).to.equal(to);
      expect(log1.args[2].toNumber()).to.equal(value);

      // check that the authorization state is now true
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(true);
    });

    it("reverts if the caller is not the payee", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the signed authorization from
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: david }
        ),
        "caller must be the payee"
      );
    });

    it("reverts if the signature does not match given parameters", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to cheat by claiming the transfer amount is double
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value * 2, // pass incorrect value
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        ),
        "invalid signature"
      );
    });

    it("reverts if the signature is not signed with the right key", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create an authorization to transfer money from Alice to Bob, but
      // sign with Bob's key instead of Alice's
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        charlie.key
      );

      // try to cheat by submitting the signed authorization that is signed by
      // a wrong person
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        ),
        "invalid signature"
      );
    });

    it("reverts if the authorization is not yet valid", async () => {
      const { from, to, value, validBefore } = receiveParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validAfter = Math.floor(Date.now() / 1000) + 10;
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization early
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        ),
        "authorization is not yet valid"
      );
    });

    it("reverts if the authorization is expired", async () => {
      // create a signed authorization that expires immediately
      const { from, to, value, validAfter } = receiveParams;
      const validBefore = Math.floor(Date.now() / 1000);
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization that is expired
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        ),
        "authorization is expired"
      );
    });

    it("reverts if the authorization has already been used", async () => {
      const { from, to, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const value = 1e6;
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.receiveWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: bob }
      );

      // try to submit the authorization again
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization has a nonce that has already been used by the signer", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const authorization = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.receiveWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        authorization.v,
        authorization.r,
        authorization.s,
        { from: bob }
      );

      // create another authorization with the same nonce, but with different
      // parameters
      const authorization2 = signReceiveAuthorization(
        from,
        to,
        1e6,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization again
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          1e6,
          validAfter,
          validBefore,
          nonce,
          authorization2.v,
          authorization2.r,
          authorization2.s,
          { from: bob }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization includes invalid transfer parameters", async () => {
      const { from, to, validAfter, validBefore } = receiveParams;
      // create a signed authorization that attempts to transfer an amount
      // that exceeds the sender's balance
      const value = initialBalance + 1;
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization with invalid transfer parameters
      await expectRevert(
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        ),
        "transfer amount exceeds balance"
      );
    });

    it("reverts if the contract is paused", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
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
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        ),
        "paused"
      );
    });

    it("reverts if the payer or the payee is blacklisted", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // payer is blacklisted
      await fiatToken.blacklist(from, { from: fiatTokenOwner });

      const submitTx = () =>
        fiatToken.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: bob }
        );

      // try to submit the authorization
      await expectRevert(submitTx(), "account is blacklisted");

      // payee is blacklisted
      await fiatToken.unBlacklist(from, { from: fiatTokenOwner });
      await fiatToken.blacklist(to, { from: fiatTokenOwner });

      // try to submit the authorization
      await expectRevert(submitTx(), "account is blacklisted");
    });
  });
}
