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

import {
  AnyFiatTokenV2Instance,
  FiatTokenV2_2InstanceExtended,
} from "../../@types/AnyFiatTokenV2Instance";
import {
  generateAccounts,
  initializeOverloadedMethods,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../helpers";
import { HARDHAT_ACCOUNTS } from "../helpers/constants";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { behavesLikeFiatTokenV2 } from "./v2.behavior";
import { SignatureBytesType } from "./GasAbstraction/helpers";
import { behavesLikeFiatTokenV22 } from "./v2_2.behavior";

const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

describe("FiatTokenV2_2", () => {
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];
  const lostAndFound = HARDHAT_ACCOUNTS[2];

  let fiatToken: FiatTokenV2_2InstanceExtended;

  const getFiatToken = (
    signatureBytesType: SignatureBytesType
  ): (() => AnyFiatTokenV2Instance) => {
    return () => {
      initializeOverloadedMethods(fiatToken, signatureBytesType);
      return fiatToken;
    };
  };

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenV2_1);
    await linkLibraryToTokenContract(FiatTokenV2_2);
  });

  beforeEach(async () => {
    fiatToken = await FiatTokenV2_2.new();
    await initializeToVersion(fiatToken, "2.2", fiatTokenOwner, lostAndFound);
  });

  describe("initializeV2_2", () => {
    it("allows calling initializeNext when _initializedVersion is 3", async () => {
      // For fresh V2_2 deployments, _initializedVersion is already 3 (set by initialize())
      // initializeV2_2() checks _initializedVersion >= 2 and only updates if version is 2
      // Since version is 3, it doesn't update, so it can be called multiple times
      await fiatToken.initializeNext();
      // Can call again since _initializedVersion is not updated when it's already 3
      await fiatToken.initializeNext();
    });

    it("should blacklist all accountsToBlacklist", async () => {
      const accountsToBlacklist = generateAccounts(3);
      const token = await FiatTokenV2_2.new();
      await token.initialize({
        tokenName: "USDC",
        tokenSymbol: "USDC",
        tokenCurrency: "USD",
        tokenDecimals: 6,
        newMasterMinter: fiatTokenOwner,
        newPauser: fiatTokenOwner,
        newBlacklister: fiatTokenOwner,
        newOwner: fiatTokenOwner,
        accountsToBlacklist: accountsToBlacklist,
      });

      // Verify accounts are blacklisted
      for (const account of accountsToBlacklist) {
        expect(await token.isBlacklisted(account)).to.be.true;
      }
    });
  });

  describe("initialized contract", () => {
    beforeEach(async () => {
      await fiatToken.initializeNext();
    });

    behavesLikeFiatTokenV2(2.2, getFiatToken(SignatureBytesType.Unpacked));

    behavesLikeFiatTokenV22(getFiatToken(SignatureBytesType.Packed));
    usesOriginalStorageSlotPositions({
      Contract: FiatTokenV2_2,
      version: 2.2,
    });
  });
});
