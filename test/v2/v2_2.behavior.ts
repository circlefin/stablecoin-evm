/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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

import BN from "bn.js";
import crypto from "crypto";
import {
  AnyFiatTokenV2Instance,
  FiatTokenV2_2InstanceExtended,
} from "../../@types/AnyFiatTokenV2Instance";
import { expectRevert, hexStringFromBuffer } from "../helpers";
import {
  ACCOUNTS_AND_KEYS,
  HARDHAT_ACCOUNTS,
  MAX_UINT256_HEX,
  POW_2_255_BN,
} from "../helpers/constants";
import { getERC1271Wallet } from "./v2.behavior";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import {
  SignatureBytesType,
  WalletType,
  makeDomainSeparator,
  prepareSignature,
  signTransferAuthorization,
  signReceiveAuthorization,
} from "./GasAbstraction/helpers";

export function behavesLikeFiatTokenV22(
  getFiatToken: () => AnyFiatTokenV2Instance
): void {
  const [minter, arbitraryAccount] = HARDHAT_ACCOUNTS.slice(3);

  let fiatTokenOwner: string;
  let domainSeparator: string;
  let fiatToken: FiatTokenV2_2InstanceExtended;

  before(async () => {
    fiatTokenOwner = await getFiatToken().owner();
  });

  beforeEach(async () => {
    fiatToken = getFiatToken() as FiatTokenV2_2InstanceExtended;
    domainSeparator = makeDomainSeparator(
      "USDC",
      "2",
      await web3.eth.getChainId(),
      fiatToken.address
    );
  });

  const v22TestParams = {
    version: 2.2,
    getFiatToken,
    getDomainSeparator: () => domainSeparator,
    getERC1271Wallet,
  };

  // Test gas abstraction functionalities with both EOA and AA wallets
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

  // Additional negative test cases.
  describe("will trigger exceeded 2^255 balance error", () => {
    const incrementAmount = 1000;
    const recipient = arbitraryAccount;
    const errorMessage = "FiatTokenV2_2: Balance exceeds (2^255 - 1)";

    beforeEach(async () => {
      const recipientInitialBalance = POW_2_255_BN.sub(new BN(incrementAmount));
      await fiatToken.configureMinter(minter, POW_2_255_BN, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(recipient, recipientInitialBalance, {
        from: minter,
      });
      expect((await fiatToken.balanceOf(recipient)).eq(recipientInitialBalance))
        .to.be.true;
    });

    it("should fail to mint to recipient if balance will exceed 2^255", async () => {
      await expectRevert(
        fiatToken.mint(recipient, incrementAmount, { from: minter }),
        errorMessage
      );
    });

    it("should fail to transfer to recipient if balance will exceed 2^255", async () => {
      await fiatToken.mint(minter, incrementAmount, { from: minter });
      await expectRevert(
        fiatToken.transfer(recipient, incrementAmount, { from: minter }),
        errorMessage
      );
    });

    it("should fail call transferFrom to recipient if balance will exceed 2^255", async () => {
      await fiatToken.mint(minter, incrementAmount, { from: minter });
      await fiatToken.approve(arbitraryAccount, incrementAmount, {
        from: minter,
      });

      await expectRevert(
        fiatToken.transferFrom(minter, recipient, incrementAmount, {
          from: arbitraryAccount,
        }),
        errorMessage
      );
    });

    context("EIP3009", () => {
      const signer = ACCOUNTS_AND_KEYS[0];
      const from = signer.address;
      const to = recipient;
      const value = incrementAmount;
      const validAfter = 0;
      const validBefore = MAX_UINT256_HEX;
      const nonce = hexStringFromBuffer(crypto.randomBytes(32));

      beforeEach(async () => {
        await fiatToken.mint(signer.address, incrementAmount, {
          from: minter,
        });
      });

      it("should fail to call transferWithAuthorization to recipient if balance will exceed 2^255", async () => {
        const signature = signTransferAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          domainSeparator,
          signer.key
        );

        await expectRevert(
          fiatToken.transferWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            ...prepareSignature(signature, SignatureBytesType.Packed),
            { from: to }
          ),
          errorMessage
        );
      });

      it("should fail to call receiveWithAuthorization to recipient if balance will exceed 2^255", async () => {
        const signature = signReceiveAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          domainSeparator,
          signer.key
        );

        await expectRevert(
          fiatToken.receiveWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            ...prepareSignature(signature, SignatureBytesType.Packed),
            { from: to }
          ),
          errorMessage
        );
      });
    });
  });
}
