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
  increaseAllowanceWithAuthorizationTypeHash,
  signIncreaseAllowanceAuthorization,
  signTransferAuthorization,
  TestParams,
} from "./helpers";

export function testIncreaseAllowanceWithAuthorization({
  getFiatToken,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
}: TestParams): void {
  describe("increaseAllowanceWithAuthorization", () => {
    let fiatToken: FiatTokenV2Instance;
    let domainSeparator: string;
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];
    let nonce: string;

    const initialBalance = 10e6;
    const increaseAllowanceParams = {
      owner: alice.address,
      spender: bob.address,
      increment: 3e6,
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
      await fiatToken.mint(increaseAllowanceParams.owner, initialBalance, {
        from: fiatTokenOwner,
      });
    });

    it("has the expected type hash", async () => {
      expect(
        await fiatToken.INCREASE_ALLOWANCE_WITH_AUTHORIZATION_TYPEHASH()
      ).to.equal(increaseAllowanceWithAuthorizationTypeHash);
    });

    it("increases allowance by a given amount when a valid authorization is given", async () => {
      const {
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization to increase the allowance granted to Bob
      // to spend Alice's funds on behalf, and sign with Alice's key
      let { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
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
      let result = await fiatToken.increaseAllowanceWithAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that the allowance is increased
      let newAllowance = increment;
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

      // create another signed authorization to increase the allowance by
      // another 2e6
      const increment2 = 2e6;
      const nonce2 = hexStringFromBuffer(crypto.randomBytes(32));
      ({ v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment2,
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
      result = await fiatToken.increaseAllowanceWithAuthorization(
        owner,
        spender,
        increment2,
        validAfter,
        validBefore,
        nonce2,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that the allowance is increased
      newAllowance += increment2;
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

    it("reverts if the decrease causes an integer overflow", async () => {
      const {
        owner,
        spender,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;

      // set initial allowance of 1
      let { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        1,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      await fiatToken.increaseAllowanceWithAuthorization(
        owner,
        spender,
        1,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // try to increase by max uint256 which will trigger addition overflow
      const increment = MAX_UINT256;
      nonce = hexStringFromBuffer(crypto.randomBytes(32));
      ({ v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      ));

      // submit the authorization causing overflow
      await expectRevert(
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "addition overflow"
      );
    });

    it("reverts if the signature does not match given parameters", async () => {
      const {
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to cheat by claiming the increase is double
      await expectRevert(
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment * 2, // pass incorrect value
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
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization to increase the allowance granted to Bob
      // to spend Alice's funds on behalf, but sign with Bob's key instead of
      // Alice's
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        bob.key
      );

      // try to cheat by submitting the authorization that is signed by a
      // wrong person
      await expectRevert(
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
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
        increment,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validAfter = Math.floor(Date.now() / 1000) + 10;
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization early
      await expectRevert(
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
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
      const { owner, spender, increment, validAfter } = increaseAllowanceParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validBefore = Math.floor(Date.now() / 1000);
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization that is expired
      await expectRevert(
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
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
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.increaseAllowanceWithAuthorization(
        owner,
        spender,
        increment,
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
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
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
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization
      const authorization = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await fiatToken.increaseAllowanceWithAuthorization(
        owner,
        spender,
        increment,
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
      const authorization2 = signIncreaseAllowanceAuthorization(
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
        fiatToken.increaseAllowanceWithAuthorization(
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
      const {
        owner,
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization that attempts to grant allowance to the
      // zero address
      const spender = ZERO_ADDRESS;
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization with invalid approval parameters
      await expectRevert(
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
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

    it("reverts if the authorization is not for an increase in allowance", async () => {
      const {
        owner: from,
        spender: to,
        increment: value,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
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
        fiatToken.increaseAllowanceWithAuthorization(
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
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
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
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
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
        increment,
        validAfter,
        validBefore,
      } = increaseAllowanceParams;
      // create a signed authorization
      const { v, r, s } = signIncreaseAllowanceAuthorization(
        owner,
        spender,
        increment,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // owner is blacklisted
      await fiatToken.blacklist(owner, { from: fiatTokenOwner });

      const submitTx = () =>
        fiatToken.increaseAllowanceWithAuthorization(
          owner,
          spender,
          increment,
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
