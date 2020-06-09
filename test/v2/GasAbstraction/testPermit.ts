import crypto from "crypto";
import { FiatTokenV2Instance } from "../../../@types/generated";
import { Approval } from "../../../@types/generated/FiatTokenV2";
import {
  ACCOUNTS_AND_KEYS,
  MAX_UINT256,
  ZERO_ADDRESS,
} from "../../helpers/constants";
import { expectRevert, hexStringFromBuffer } from "../../helpers";
import {
  signPermit,
  TestParams,
  signTransferAuthorization,
  permitTypeHash,
} from "./helpers";

export function testPermit({
  getFiatToken,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
}: TestParams): void {
  describe("permit", () => {
    let fiatToken: FiatTokenV2Instance;
    let domainSeparator: string;
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];

    const initialBalance = 10e6;
    const permitParams = {
      owner: alice.address,
      spender: bob.address,
      value: 7e6,
      nonce: 0,
      deadline: MAX_UINT256,
    };

    beforeEach(async () => {
      fiatToken = getFiatToken();
      domainSeparator = getDomainSeparator();
      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(permitParams.owner, initialBalance, {
        from: fiatTokenOwner,
      });
    });

    it("has the expected type hash", async () => {
      expect(await fiatToken.PERMIT_TYPEHASH()).to.equal(permitTypeHash);
    });

    it("grants allowance when a valid permit is given", async () => {
      const { owner, spender, deadline } = permitParams;
      let { value } = permitParams;
      // create a signed permit to grant Bob permission to spend Alice's funds
      // on behalf, and sign with Alice's key
      let nonce = 0;
      let { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // check that the allowance is initially zero
      expect((await fiatToken.allowance(owner, spender)).toNumber()).to.equal(
        0
      );
      // check that the next nonce expected is zero
      expect((await fiatToken.nonces(owner)).toNumber()).to.equal(0);

      // a third-party, Charlie (not Alice) submits the permit
      let result = await fiatToken.permit(
        owner,
        spender,
        value,
        deadline,
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
      let log = result.logs[0] as Truffle.TransactionLog<Approval>;
      expect(log.event).to.equal("Approval");
      expect(log.args[0]).to.equal(owner);
      expect(log.args[1]).to.equal(spender);
      expect(log.args[2].toNumber()).to.equal(value);

      // check that the next nonce expected is now 1
      expect((await fiatToken.nonces(owner)).toNumber()).to.equal(1);

      // increment nonce
      nonce = 1;
      value = 1e6;
      ({ v, r, s } = signPermit(
        owner,
        spender,
        1e6,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      ));

      // submit the permit
      result = await fiatToken.permit(
        owner,
        spender,
        value,
        deadline,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that allowance is updated
      expect((await fiatToken.allowance(owner, spender)).toNumber()).to.equal(
        1e6
      );

      // check that Approval event is emitted
      log = result.logs[0] as Truffle.TransactionLog<Approval>;
      expect(log.event).to.equal("Approval");
      expect(log.args[0]).to.equal(owner);
      expect(log.args[1]).to.equal(spender);
      expect(log.args[2].toNumber()).to.equal(1e6);
    });

    it("reverts if the signature does not match given parameters", async () => {
      const { owner, spender, value, nonce, deadline } = permitParams;
      // create a signed permit
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // try to cheat by claiming the approved amount is double
      await expectRevert(
        fiatToken.permit(
          owner,
          spender,
          value * 2, // pass incorrect value
          deadline,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the signature is not signed with the right key", async () => {
      const { owner, spender, value, nonce, deadline } = permitParams;
      // create a signed permit to grant Bob permission to spend
      // Alice's funds on behalf, but sign with Bob's key instead of Alice's
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        bob.key
      );

      // try to cheat by submitting the permit that is signed by a
      // wrong person
      await expectRevert(
        fiatToken.permit(owner, spender, value, deadline, v, r, s, {
          from: charlie,
        }),
        "invalid signature"
      );
    });

    it("reverts if the permit is expired", async () => {
      const { owner, spender, value, nonce } = permitParams;
      // create a signed permit that won't be valid until 10 seconds
      // later
      const deadline = Math.floor(Date.now() / 1000) - 1;
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // try to submit the permit that is expired
      await expectRevert(
        fiatToken.permit(owner, spender, value, deadline, v, r, s, {
          from: charlie,
        }),
        "permit is expired"
      );
    });

    it("reverts if the nonce given does not match the next nonce expected", async () => {
      const { owner, spender, value, deadline } = permitParams;
      const nonce = 1;
      // create a signed permit
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );
      // check that the next nonce expected is 0, not 1
      expect((await fiatToken.nonces(owner)).toNumber()).to.equal(0);

      // try to submit the permit
      await expectRevert(
        fiatToken.permit(owner, spender, value, deadline, v, r, s, {
          from: charlie,
        }),
        "invalid signature"
      );
    });

    it("reverts if the permit has already been used", async () => {
      const { owner, spender, value, nonce, deadline } = permitParams;
      // create a signed permit
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // submit the permit
      await fiatToken.permit(owner, spender, value, deadline, v, r, s, {
        from: charlie,
      });

      // try to submit the permit again
      await expectRevert(
        fiatToken.permit(owner, spender, value, deadline, v, r, s, {
          from: charlie,
        }),
        "invalid signature"
      );
    });

    it("reverts if the permit has a nonce that has already been used by the signer", async () => {
      const { owner, spender, value, nonce, deadline } = permitParams;
      // create a signed permit
      const permit = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // submit the permit
      await fiatToken.permit(
        owner,
        spender,
        value,
        deadline,
        permit.v,
        permit.r,
        permit.s,
        { from: charlie }
      );

      // create another signed permit with the same nonce, but
      // with different parameters
      const permit2 = signPermit(
        owner,
        spender,
        1e6,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // try to submit the permit again
      await expectRevert(
        fiatToken.permit(
          owner,
          spender,
          1e6,
          deadline,
          permit2.v,
          permit2.r,
          permit2.s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the permit includes invalid approval parameters", async () => {
      const { owner, value, nonce, deadline } = permitParams;
      // create a signed permit that attempts to grant allowance to the
      // zero address
      const spender = ZERO_ADDRESS;
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // try to submit the permit with invalid approval parameters
      await expectRevert(
        fiatToken.permit(owner, spender, value, deadline, v, r, s, {
          from: charlie,
        }),
        "approve to the zero address"
      );
    });

    it("reverts if the permit is not for an approval", async () => {
      const {
        owner: from,
        spender: to,
        value,
        deadline: validBefore,
      } = permitParams;
      // create a signed permit for a transfer
      const validAfter = 0;
      const nonce = hexStringFromBuffer(crypto.randomBytes(32));
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

      // try to submit the transfer permit
      await expectRevert(
        fiatToken.permit(from, to, value, validBefore, v, r, s, {
          from: charlie,
        }),
        "invalid signature"
      );
    });

    it("reverts if the contract is paused", async () => {
      const { owner, spender, value, nonce, deadline } = permitParams;
      // create a signed permit
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // pause the contract
      await fiatToken.pause({ from: fiatTokenOwner });

      // try to submit the permit
      await expectRevert(
        fiatToken.permit(owner, spender, value, deadline, v, r, s, {
          from: charlie,
        }),
        "paused"
      );
    });

    it("reverts if the owner or the spender is blacklisted", async () => {
      const { owner, spender, value, nonce, deadline } = permitParams;
      // create a signed permit
      const { v, r, s } = signPermit(
        owner,
        spender,
        value,
        nonce,
        deadline,
        domainSeparator,
        alice.key
      );

      // owner is blacklisted
      await fiatToken.blacklist(owner, { from: fiatTokenOwner });

      const submitTx = () =>
        fiatToken.permit(owner, spender, value, deadline, v, r, s, {
          from: charlie,
        });

      // try to submit the permit
      await expectRevert(submitTx(), "account is blacklisted");

      // spender is blacklisted
      await fiatToken.unBlacklist(owner, { from: fiatTokenOwner });
      await fiatToken.blacklist(spender, { from: fiatTokenOwner });

      // try to submit the permit
      await expectRevert(submitTx(), "account is blacklisted");
    });
  });
}
