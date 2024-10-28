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

import { FiatTokenV2_1Instance } from "../../@types/generated";
import { expectRevert, linkLibraryToTokenContract } from "../helpers";
import { HARDHAT_ACCOUNTS } from "../helpers/constants";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { behavesLikeFiatTokenV2 } from "./v2.behavior";

const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");

describe("FiatTokenV2_1", () => {
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];

  let fiatToken: FiatTokenV2_1Instance;

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenV2_1);
  });

  beforeEach(async () => {
    fiatToken = await FiatTokenV2_1.new();
    await fiatToken.initialize(
      "USDC",
      "USDC",
      "USD",
      6,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner
    );
    await fiatToken.initializeV2("USDC", { from: fiatTokenOwner });
  });

  behavesLikeFiatTokenV2(2.1, () => fiatToken);
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV2_1,
    version: 2.1,
  });

  describe("initializeV2_1", () => {
    const [, user, lostAndFound] = HARDHAT_ACCOUNTS;

    beforeEach(async () => {
      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(user, 100e6, { from: fiatTokenOwner });
    });

    it("transfers locked funds to a given address", async () => {
      // send tokens to the contract address
      await fiatToken.transfer(fiatToken.address, 100e6, { from: user });

      expect(
        (await fiatToken.balanceOf(fiatToken.address)).toNumber()
      ).to.equal(100e6);

      // initialize v2.1
      await fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner });

      expect(
        (await fiatToken.balanceOf(fiatToken.address)).toNumber()
      ).to.equal(0);

      expect((await fiatToken.balanceOf(lostAndFound)).toNumber()).to.equal(
        100e6
      );
    });

    it("blocks transfers to the contract address", async () => {
      await fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner });

      expect(await fiatToken.isBlacklisted(fiatToken.address)).to.equal(true);

      await expectRevert(
        fiatToken.transfer(fiatToken.address, 100e6, { from: user }),
        "account is blacklisted"
      );
    });

    it("disallows calling initializeV2_1 twice", async () => {
      await fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner });

      await expectRevert(
        fiatToken.initializeV2_1(lostAndFound, { from: fiatTokenOwner })
      );
    });
  });

  describe("version", () => {
    it("returns the version string", async () => {
      expect(await fiatToken.version()).to.equal("2");
    });
  });
});
