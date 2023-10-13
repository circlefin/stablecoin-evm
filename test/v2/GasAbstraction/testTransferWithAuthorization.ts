import crypto from "crypto";
import { MockErc1271WalletInstance } from "../../../@types/generated";
import {
  AuthorizationUsed,
  Transfer,
} from "../../../@types/generated/FiatTokenV2";
import { ACCOUNTS_AND_KEYS, MAX_UINT256_HEX } from "../../helpers/constants";
import { expectRevert, hexStringFromBuffer } from "../../helpers";
import {
  transferWithAuthorizationTypeHash,
  signTransferAuthorization,
  TestParams,
  WalletType,
  prepareSignature,
} from "./helpers";
import { AnyFiatTokenV2Instance } from "../../../@types/AnyFiatTokenV2Instance";

export function testTransferWithAuthorization({
  getFiatToken,
  getERC1271Wallet,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
  signerWalletType,
  signatureBytesType,
}: TestParams): void {
  describe(`transferWithAuthorization with ${signerWalletType} wallet, ${signatureBytesType} signature interface`, async () => {
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];
    const nonce: string = hexStringFromBuffer(crypto.randomBytes(32));
    const initialBalance = 10e6;
    const transferParams = {
      from: "",
      to: bob.address,
      value: 7e6,
      validAfter: 0,
      validBefore: MAX_UINT256_HEX,
      nonce,
    };

    let fiatToken: AnyFiatTokenV2Instance;
    let aliceWallet: MockErc1271WalletInstance;
    let domainSeparator: string;

    beforeEach(async () => {
      fiatToken = getFiatToken();
      aliceWallet = await getERC1271Wallet(alice.address);
      domainSeparator = getDomainSeparator();

      // Initialize `from` address either as Alice's EOA address or Alice's wallet address
      if (signerWalletType == WalletType.AA) {
        transferParams.from = aliceWallet.address;
      } else {
        transferParams.from = alice.address;
      }

      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(transferParams.from, initialBalance, {
        from: fiatTokenOwner,
      });
    });

    it("has the expected type hash", async () => {
      expect(await fiatToken.TRANSFER_WITH_AUTHORIZATION_TYPEHASH()).to.equal(
        transferWithAuthorizationTypeHash
      );
    });

    it("executes a transfer when a valid authorization is given", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create an authorization to transfer money from Alice to Bob and sign
      // with Alice's key
      const signature = signTransferAuthorization(
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

      // a third-party, Charlie (not Alice) submits the signed authorization
      const result = await fiatToken.transferWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        ...prepareSignature(signature, signatureBytesType),
        { from: charlie }
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

    it("reverts if the signature does not match given parameters", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create a signed authorization
      const signature = signTransferAuthorization(
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
        fiatToken.transferWithAuthorization(
          from,
          to,
          value * 2, // pass incorrect value
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the signature is not signed with the right key", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create an authorization to transfer money from Alice to Bob, but
      // sign with Bob's key instead of Alice's
      const signature = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        bob.key
      );

      // try to cheat by submitting the signed authorization that is signed by
      // a wrong person
      await expectRevert(
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the authorization is not yet valid", async () => {
      const { from, to, value, validBefore } = transferParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validAfter = Math.floor(Date.now() / 1000) + 10;
      const signature = signTransferAuthorization(
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
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
        ),
        "authorization is not yet valid"
      );
    });

    it("reverts if the authorization is expired", async () => {
      // create a signed authorization that expires immediately
      const { from, to, value, validAfter } = transferParams;
      const validBefore = Math.floor(Date.now() / 1000);
      const signature = signTransferAuthorization(
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
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
        ),
        "authorization is expired"
      );
    });

    it("reverts if the authorization has already been used", async () => {
      const { from, to, validAfter, validBefore } = transferParams;
      // create a signed authorization
      const value = 1e6;
      const signature = signTransferAuthorization(
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
      await fiatToken.transferWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        ...prepareSignature(signature, signatureBytesType),
        { from: charlie }
      );

      // try to submit the authorization again
      await expectRevert(
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization has a nonce that has already been used by the signer", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
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

      // submit the authorization
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

      // create another authorization with the same nonce, but with different
      // parameters
      const authorization2 = signTransferAuthorization(
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
        fiatToken.transferWithAuthorization(
          from,
          to,
          1e6,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(authorization2, signatureBytesType),
          { from: charlie }
        ),
        "authorization is used or canceled"
      );
    });

    it("reverts if the authorization includes invalid transfer parameters", async () => {
      const { from, to, validAfter, validBefore } = transferParams;
      // create a signed authorization that attempts to transfer an amount
      // that exceeds the sender's balance
      const value = initialBalance + 1;
      const signature = signTransferAuthorization(
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
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
        ),
        "transfer amount exceeds balance"
      );
    });

    it("reverts if the contract is paused", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create a signed authorization
      const signature = signTransferAuthorization(
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
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
        ),
        "paused"
      );
    });

    it("reverts if the payer or the payee is blacklisted", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create a signed authorization
      const signature = signTransferAuthorization(
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
        fiatToken.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          ...prepareSignature(signature, signatureBytesType),
          { from: charlie }
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
