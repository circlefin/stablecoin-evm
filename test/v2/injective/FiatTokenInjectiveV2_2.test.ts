/**
 * Copyright 2026 Circle Internet Group, Inc. All rights reserved.
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

import {
  initializeOverloadedMethods,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../../helpers";
import { behavesLikeFiatTokenV2 } from "./../v2.behavior";
import { behavesLikeFiatTokenV22 } from "./../v2_2.behavior";
import { usesOriginalStorageSlotPositions } from "../../helpers/storageSlots.behavior";
import { SignatureBytesType } from "../GasAbstraction/helpers";
import {
  AnyFiatTokenV2Instance,
  FiatTokenInjectiveV2_2InstanceExtended,
} from "../../../@types/AnyFiatTokenV2Instance";
import { HARDHAT_ACCOUNTS } from "../../helpers/constants";

const FiatTokenInjectiveV2_2 = artifacts.require("FiatTokenInjectiveV2_2");
const MockBankPrecompile = artifacts.require("MockBankPrecompile");

describe("FiatTokenInjectiveV2_2", () => {
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];
  const lostAndFound = HARDHAT_ACCOUNTS[2];

  let fiatTokenInjective: FiatTokenInjectiveV2_2InstanceExtended;
  let mockBankPrecompile: Truffle.ContractInstance;

  const getFiatToken = (
    signatureBytesType: SignatureBytesType
  ): (() => AnyFiatTokenV2Instance) => {
    return () => {
      initializeOverloadedMethods(fiatTokenInjective, signatureBytesType);
      return fiatTokenInjective;
    };
  };

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenInjectiveV2_2);

    // Deploy mock bank precompile once
    mockBankPrecompile = await MockBankPrecompile.new();

    // Deploy the mock bank precompile at the expected precompile address
    // This uses hardhat's ability to set code at a specific address
    const BANK_PRECOMPILE_ADDRESS =
      "0x0000000000000000000000000000000000000064";
    const mockBankCode = await web3.eth.getCode(mockBankPrecompile.address);
    if (web3.currentProvider && typeof web3.currentProvider !== "string") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (web3.currentProvider as any).send(
        {
          jsonrpc: "2.0",
          method: "hardhat_setCode",
          params: [BANK_PRECOMPILE_ADDRESS, mockBankCode],
          id: new Date().getTime(),
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {}
      );
    }

    // Deploy initial contract instance for behavior tests' before hooks
    fiatTokenInjective = await FiatTokenInjectiveV2_2.new();
    await initializeToVersion(
      fiatTokenInjective,
      "2.2",
      fiatTokenOwner,
      lostAndFound
    );
  });

  beforeEach(async () => {
    // Deploy FiatTokenInjectiveV2_2
    fiatTokenInjective = await FiatTokenInjectiveV2_2.new();

    // Initialize to version 2.2
    await initializeToVersion(
      fiatTokenInjective,
      "2.2",
      fiatTokenOwner,
      lostAndFound
    );
  });

  describe("initialized FiatTokenInjectiveV2_2 contract", () => {
    behavesLikeFiatTokenV2(2.2, getFiatToken(SignatureBytesType.Unpacked));
    behavesLikeFiatTokenV22(getFiatToken(SignatureBytesType.Packed));

    // Note: Storage slot tests automatically detect Injective and test accordingly.
    // For Injective: slot 11 (totalSupply) should be empty, and only blacklist bits
    // (2^255) in slot 9 mapping are tested (balance is in bank precompile).
    usesOriginalStorageSlotPositions({
      Contract: FiatTokenInjectiveV2_2,
      version: 2.2,
    });
  });

  describe("Injective-specific functionality", () => {
    describe("isTransferRestricted", () => {
      const sender = HARDHAT_ACCOUNTS[6];
      const receiver = HARDHAT_ACCOUNTS[7];
      const dummyCoin = { amount: 100, denom: "test-denom" };

      it("should return false when transfer is not restricted", async () => {
        const isRestricted = await fiatTokenInjective.isTransferRestricted(
          sender,
          receiver,
          dummyCoin
        );
        expect(isRestricted).to.equal(false);
      });

      it("should return true when contract is paused", async () => {
        await fiatTokenInjective.pause({ from: fiatTokenOwner });

        const isRestricted = await fiatTokenInjective.isTransferRestricted(
          sender,
          receiver,
          dummyCoin
        );
        expect(isRestricted).to.equal(true);

        await fiatTokenInjective.unpause({ from: fiatTokenOwner });
      });

      it("should return true when sender is blacklisted", async () => {
        await fiatTokenInjective.blacklist(sender, { from: fiatTokenOwner });

        const isRestricted = await fiatTokenInjective.isTransferRestricted(
          sender,
          receiver,
          dummyCoin
        );
        expect(isRestricted).to.equal(true);
      });

      it("should return true when receiver is blacklisted", async () => {
        await fiatTokenInjective.blacklist(receiver, { from: fiatTokenOwner });

        const isRestricted = await fiatTokenInjective.isTransferRestricted(
          sender,
          receiver,
          dummyCoin
        );
        expect(isRestricted).to.equal(true);
      });
    });
  });
});
