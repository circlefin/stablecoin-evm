/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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

import { usesOriginalStorageSlotPositions } from "../../helpers/storageSlots.behavior";

import {
  expectRevert,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../../helpers";
import { behavesLikeFiatTokenV2 } from "./../v2.behavior";
import { behavesLikeFiatTokenV22 } from "./../v2_2.behavior";
import { initializeOverloadedMethods } from "../FiatTokenV2_2.test";
import { SignatureBytesType } from "../GasAbstraction/helpers";
import {
  AnyFiatTokenV2Instance,
  FiatTokenCeloV2_2InstanceExtended,
} from "../../../@types/AnyFiatTokenV2Instance";
import { FeeCallerChanged } from "../../../@types/generated/FiatTokenCeloV2_2";
import { HARDHAT_ACCOUNTS } from "../../helpers/constants";

const FiatTokenCeloV2_2 = artifacts.require("FiatTokenCeloV2_2");

// See FiatTokenCeloV2_2#FEE_CALLER_SLOT.
async function getFeeCaller(fiatTokenCelo: FiatTokenCeloV2_2InstanceExtended) {
  const feeCaller = await web3.eth.getStorageAt(
    fiatTokenCelo.address,
    "0xdca914aef3e4e19727959ebb1e70b58822e2c7b796d303902adc19513fcb4af5"
  );
  return web3.utils.toChecksumAddress("0x" + feeCaller.slice(26));
}

describe("FiatTokenCeloV2_2", () => {
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];
  const lostAndFound = HARDHAT_ACCOUNTS[2];
  const from = HARDHAT_ACCOUNTS[1];
  const feeRecipient = HARDHAT_ACCOUNTS[5];
  const gatewayFeeRecipient = HARDHAT_ACCOUNTS[5];
  const communityFund = HARDHAT_ACCOUNTS[5];
  const feeCaller = fiatTokenOwner;

  let fiatTokenCelo: FiatTokenCeloV2_2InstanceExtended;

  const getFiatToken = (
    signatureBytesType: SignatureBytesType
  ): (() => AnyFiatTokenV2Instance) => {
    return () => {
      initializeOverloadedMethods(fiatTokenCelo, signatureBytesType);
      return fiatTokenCelo;
    };
  };

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenCeloV2_2);
  });

  beforeEach(async () => {
    fiatTokenCelo = await FiatTokenCeloV2_2.new();
    await initializeToVersion(
      fiatTokenCelo,
      "2.2",
      fiatTokenOwner,
      lostAndFound
    );
    // Ensure we set the debit/credit fee caller for testing.
    await fiatTokenCelo.updateFeeCaller(feeCaller, { from: fiatTokenOwner });
  });

  describe("initialized FiatTokenCeloV2_2 contract", async () => {
    await fiatTokenCelo.initializeV2_2([], "CELOUSDC");

    behavesLikeFiatTokenV22(getFiatToken(SignatureBytesType.Unpacked));
    behavesLikeFiatTokenV2(2.2, getFiatToken(SignatureBytesType.Packed));
    // Verify that the Celo interface and implementation
    // has not interfered with existing storage slots.
    // DEBITED_MUTEX_SLOT should be statically embedded.
    usesOriginalStorageSlotPositions({
      Contract: FiatTokenCeloV2_2,
      version: 2.2,
    });
  });

  describe("onlyFeeCaller", () => {
    const errorMessage = "FiatTokenCeloV2_2: caller is not the fee caller";

    it("should fail to call debitGasFees when caller is not fee caller", async () => {
      await expectRevert(
        fiatTokenCelo.debitGasFees(from, 1, { from: from }),
        errorMessage
      );
    });

    it("should fail to call creditGasFees when caller is not fee caller", async () => {
      await expectRevert(
        fiatTokenCelo.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          1,
          1,
          1,
          1,
          { from: from }
        ),
        errorMessage
      );
    });
  });

  describe("feeCaller", () => {
    it("should return correct feeCaller", async () => {
      expect(await fiatTokenCelo.feeCaller())
        .to.equal(feeCaller)
        .to.equal(
          web3.utils.toChecksumAddress(await getFeeCaller(fiatTokenCelo))
        );
    });
  });

  describe("updateFeeCaller", () => {
    it("should fail to update fee caller when sender is not token owner", async () => {
      const ownableError = "Ownable: caller is not the owner";
      await expectRevert(
        fiatTokenCelo.updatePauser(from, { from: from }),
        ownableError
      );
    });

    it("should emit FeeCallerChanged event", async () => {
      const newFeeCaller = communityFund;
      const updateFeeCallerEvent = await fiatTokenCelo.updateFeeCaller(
        newFeeCaller,
        { from: fiatTokenOwner }
      );

      const log = updateFeeCallerEvent.logs[0] as Truffle.TransactionLog<
        FeeCallerChanged
      >;
      assert.strictEqual(log.event, "FeeCallerChanged");
      assert.strictEqual(log.args.newAddress, newFeeCaller);
    });
  });
});
