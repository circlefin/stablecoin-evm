/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import crypto from "crypto";
import { MockERC1271WalletInstance } from "../../../@types/generated";
import {
  AuthorizationUsed,
  Transfer,
} from "../../../@types/generated/FiatTokenV2";
import {
  ACCOUNTS_AND_KEYS,
  HARDHAT_ACCOUNTS,
  MAX_UINT256_HEX,
} from "../../helpers/constants";
import { expectRevert, hexStringFromBuffer } from "../../helpers";
import {
  prepareSignature,
  receiveWithAuthorizationTypeHash,
  signReceiveAuthorization,
  TestParams,
  WalletType,
} from "./helpers";
import { AnyFiatTokenV2Instance } from "../../../@types/AnyFiatTokenV2Instance";

export function testReceiveWithAuthorization({
  getFiatToken,
  getERC1271Wallet,
  getDomainSeparator,
  signerWalletType,
  signatureBytesType,
}: TestParams): void {
  describe(`receiveWithAuthorization with ${signerWalletType} wallet, ${signatureBytesType} signature interface`, async () => {
    const [alice, charlie] = ACCOUNTS_AND_KEYS;
    const [, bob, david] = HARDHAT_ACCOUNTS;
    const nonce: string = hexStringFromBuffer(crypto.randomBytes(32));
    const initialBalance = 10e6;
    const receiveParams = {
      from: "",
      to: bob,
      value: 7e6,
      validAfter: 0,
      validBefore: MAX_UINT256_HEX,
      nonce,
    };

    let fiatTokenOwner: string;
    let fiatToken: AnyFiatTokenV2Instance;
    let aliceWallet: MockERC1271WalletInstance;
    let domainSeparator: string;

    before(async () => {
      fiatTokenOwner = await getFiatToken().owner();
    });

    beforeEach(async () => {
      fiatToken = getFiatToken();
      aliceWallet = await getERC1271Wallet(alice.address);
      domainSeparator = getDomainSeparator();

      // Initialize `from` address either as Alice's EOA address or Alice's wallet address
      if (signerWalletType == WalletType.AA) {
        receiveParams.from = aliceWallet.address;
      } else {
        receiveParams.from = alice.address;
      }

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
      const signature = signReceiveAuthorization(
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
        ...prepareSignature(signature, signatureBytesType),
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
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
          { from: david }
        ),
        "caller must be the payee"
      );
    });

    it("reverts if the signature does not match given parameters", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
          { from: bob }
        ),
        "invalid signature"
      );
    });

    it("reverts if the signature is not signed with the right key", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create an authorization to transfer money from Alice to Bob, but
      // sign with Bob's key instead of Alice's
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
          { from: bob }
        ),
        "invalid signature"
      );
    });

    it("reverts if the authorization is not yet valid", async () => {
      const { from, to, value, validBefore } = receiveParams;
      // create a signed authorization that won't be valid until 1 day later
      const validAfter = Math.floor(Date.now() / 1000) + 86400;
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
          { from: bob }
        ),
        "authorization is not yet valid"
      );
    });

    it("reverts if the authorization is expired", async () => {
      // create a signed authorization that expires immediately
      const { from, to, value, validAfter } = receiveParams;
      const validBefore = Math.floor(Date.now() / 1000);
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
          { from: bob }
        ),
        "authorization is expired"
      );
    });

    it("reverts if the authorization has already been used", async () => {
      const { from, to, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const value = 1e6;
      const signature = signReceiveAuthorization(
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
        ...prepareSignature(signature, signatureBytesType),
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
          ...prepareSignature(signature, signatureBytesType),
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
        ...prepareSignature(authorization, signatureBytesType),
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
          ...prepareSignature(authorization2, signatureBytesType),
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
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
          { from: bob }
        ),
        "transfer amount exceeds balance"
      );
    });

    it("reverts if the contract is paused", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
          { from: bob }
        ),
        "paused"
      );
    });

    it("reverts if the payer or the payee is blacklisted", async () => {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const signature = signReceiveAuthorization(
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
          ...prepareSignature(signature, signatureBytesType),
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
