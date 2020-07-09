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
  decreaseAllowanceWithAuthorizationTypeHash,
  signIncreaseAllowanceAuthorization,
  signDecreaseAllowanceAuthorization,
  signTransferAuthorization,
  TestParams,
} from "./helpers";

export function testDecreaseAllowanceWithAuthorization({
  getFiatToken,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
}: TestParams): void {
  describe("decreaseAllowanceWithAuthorization", () => {
    let fiatToken: FiatTokenV2Instance;
    let domainSeparator: string;
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];
    let nonce: string;

    const initialBalance = 10e6;
    const initialAllowance = 10e6;
    const decreaseAllowanceParams = {
      owner: alice.address,
      spender: bob.address,
      decrement: 3e6,
      validAfter: 0,
      validBefore: MAX_UINT256,
    };

    beforeEach(async () => {
      fiatToken = getFiatToken();
      domainSeparator = getDomainSeparator();
      nonce = hexStringFromBuffer(crypto.randomBytes(32));

      const { owner, spender } = decreaseAllowanceParams;
      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(owner, initialBalance, {
        from: fiatTokenOwner,
      });

      // set initial allowance to be 10e6
      const nonceForIncrease = hexStringFromBuffer(crypto.randomBytes(32));
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        initialAllowance,
        0,
        MAX_UINT256,
        nonceForIncrease,
        domainSeparator,
        alice.key
      );

      await fiatToken.increaseAllowanceWithAuthorization(
        owner,
        spender,
        initialAllowance,
        0,
        MAX_UINT256,
        nonceForIncrease,
        v,
        r,
        s,
        { from: charlie }
      );
    });

    it("has the expected type hash", async () => {
      expect(
        await fiatToken.DECREASE_ALLOWANCE_WITH_AUTHORIZATION_TYPEHASH()
      ).to.equal(decreaseAllowanceWithAuthorizationTypeHash);
    });

    it("decreases allowance by a given amount when a valid authorization is given", async () => {
      const {
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization to decrease the allowance granted to Bob
      // to spend Alice's funds on behalf, and sign with Alice's key
      let { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check the initial allowance
      expect((await fiatToken.allowance(owner, spender)).toNumber()).to.equal(
        initialAllowance
      );

      // check that the authorization state is 0 = Unused
      expect(
        (await fiatToken.authorizationState(owner, nonce)).toNumber()
      ).to.equal(0);

      // a third-party, Charlie (not Alice) submits the authorization
      let result = await fiatToken.decreaseAllowanceWithAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that the allowance is decreased
      let newAllowance = initialAllowance - decrement;
      expect((await fiatToken.allowance(owner, spender)).toNumber()).to.equal(
        newAllowance
      );

      // check that AuthorizationUsed event is emitted
      let log0 = result.logs[0] as Truffle.TransactionLog<AuthorizationUsed>;
      expect(log0.event).to.equal("AuthorizationUsed");
      expect(log0.args[0]).to.equal(owner);
      expect(log0.args[1]).to.equal(nonce);

      // check that Approval event is emitted
      let log1 = result.logs[1] as Truffle.TransactionLog<Approval>;
      expect(log1.event).to.equal("Approval");
      expect(log1.args[0]).to.equal(owner);
      expect(log1.args[1]).to.equal(spender);
      expect(log1.args[2].toNumber()).to.equal(newAllowance);

      // check that the authorization state is now 1 = Used
      expect(
        (await fiatToken.authorizationState(owner, nonce)).toNumber()
      ).to.equal(1);

      // create another signed authorization to decrease the allowance by
      // another 2e6
      const decrement2 = 2e6;
      const nonce2 = hexStringFromBuffer(crypto.randomBytes(32));
      ({ v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement2,
        validAfter,
        validBefore,
        nonce2,
        domainSeparator,
        alice.key
      ));

      // check that the authorization state is 0 = Unused
      expect(
        (await fiatToken.authorizationState(owner, nonce2)).toNumber()
      ).to.equal(0);

      // submit the second authorization
      result = await fiatToken.decreaseAllowanceWithAuthorization(
        owner,
        spender,
        decrement2,
        validAfter,
        validBefore,
        nonce2,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that the allowance is decreased
      newAllowance -= decrement2;
      expect((await fiatToken.allowance(owner, spender)).toNumber()).to.equal(
        newAllowance
      );

      // check that AuthorizationUsed event is emitted
      log0 = result.logs[0] as Truffle.TransactionLog<AuthorizationUsed>;
      expect(log0.event).to.equal("AuthorizationUsed");
      expect(log0.args[0]).to.equal(owner);
      expect(log0.args[1]).to.equal(nonce2);

      // check that Approval event is emitted
      log1 = result.logs[1] as Truffle.TransactionLog<Approval>;
      expect(log1.event).to.equal("Approval");
      expect(log1.args[0]).to.equal(owner);
      expect(log1.args[1]).to.equal(spender);
      expect(log1.args[2].toNumber()).to.equal(newAllowance);

      // check that the authorization state is now 1 = Used
      expect(
        (await fiatToken.authorizationState(owner, nonce2)).toNumber()
      ).to.equal(1);
    });

    it("reverts if the decrease is greater than current allowance", async () => {
      const {
        owner,
        spender,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      const decrement = initialAllowance + 1;
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization with invalid approval parameters
      await expectRevert(
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "decreased allowance below zero"
      );
    });

    it("reverts if the decrease causes an integer overflow", async () => {
      const {
        owner,
        spender,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      const decrement = MAX_UINT256;
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // a subtraction causing overflow does not actually happen because
      // it catches that the given decrement is greater than the current
      // allowance
      await expectRevert(
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "decreased allowance below zero"
      );
    });

    it("reverts if the signature does not match given parameters", async () => {
      const {
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to cheat by claiming the decrease is double
      await expectRevert(
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement * 2, // pass incorrect value
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
      const {
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization to decrease the allowance granted to Bob
      // to spend Alice's funds on behalf, but sign with Bob's key instead of
      // Alice's
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        bob.key
      );

      // try to cheat by submitting the authorization that is signed by a
      // wrong person
      await expectRevert(
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
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
      const {
        owner,
        spender,
        decrement,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validAfter = Math.floor(Date.now() / 1000) + 10;
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization early
      await expectRevert(
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
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
      const { owner, spender, decrement, validAfter } = decreaseAllowanceParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validBefore = Math.floor(Date.now() / 1000);
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization that is expired
      await expectRevert(
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
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
      const {
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.decreaseAllowanceWithAuthorization(
        owner,
        spender,
        decrement,
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
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
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
      const {
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization
      const authorization = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.decreaseAllowanceWithAuthorization(
        owner,
        spender,
        decrement,
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
      const authorization2 = signDecreaseAllowanceAuthorization(
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
        fiatToken.decreaseAllowanceWithAuthorization(
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

    it("reverts if the authorization includes invalid parameters", async () => {
      const { owner, validAfter, validBefore } = decreaseAllowanceParams;
      const decrement = 0;
      // create a signed authorization that attempts to grant allowance to the
      // zero address
      const spender = ZERO_ADDRESS;
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization with invalid approval parameters
      await expectRevert(
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
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

    it("reverts if the authorization is not for an decrease in allowance", async () => {
      const {
        owner: from,
        spender: to,
        decrement: value,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
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
        fiatToken.decreaseAllowanceWithAuthorization(
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
      const {
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
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
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
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
      const {
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
      } = decreaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signDecreaseAllowanceAuthorization(
        owner,
        spender,
        decrement,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // owner is blacklisted
      await fiatToken.blacklist(owner, { from: fiatTokenOwner });

      const submitTx = () =>
        fiatToken.decreaseAllowanceWithAuthorization(
          owner,
          spender,
          decrement,
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
