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

import BN from "bn.js";
import { MockFiatTokenWithEditableBalanceAndBlacklistStatesInstance } from "../../@types/generated";
import {
  expectRevert,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../helpers";
import {
  ACCOUNTS_AND_KEYS,
  HARDHAT_ACCOUNTS,
  POW_2_255_BN,
} from "../helpers/constants";

const MockFiatTokenWithEditableBalanceAndBlacklistStates = artifacts.require(
  "MockFiatTokenWithEditableBalanceAndBlacklistStates"
);

describe("MockFiatTokenWithEditableBalanceAndBlacklistStates", () => {
  const userOne = ACCOUNTS_AND_KEYS[0].address;
  const [, , lostAndFound] = HARDHAT_ACCOUNTS;
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];

  let fiatToken: MockFiatTokenWithEditableBalanceAndBlacklistStatesInstance;

  const ZERO = new BN(0);
  const SEVEN = new BN(7, 10);

  before(async () => {
    await linkLibraryToTokenContract(
      MockFiatTokenWithEditableBalanceAndBlacklistStates
    );
  });

  beforeEach(async () => {
    fiatToken = await MockFiatTokenWithEditableBalanceAndBlacklistStates.new();
    await initializeToVersion(fiatToken, "2.2", fiatTokenOwner, lostAndFound);
  });

  async function expectBalanceAndBlacklistStatesToBe(
    account: string,
    expectedState: BN
  ) {
    const currentState = await fiatToken.getBalanceAndBlacklistStates(account);
    expect(currentState.eq(expectedState)).to.be.true;
  }

  describe("internal_setBlacklistState", () => {
    context("when _shouldBlacklist is true", () => {
      const _shouldBlacklist = true;

      it("should store 2^255 if the account was not blacklisted", async () => {
        await expectBalanceAndBlacklistStatesToBe(userOne, ZERO);

        await fiatToken.internal_setBlacklistState(userOne, _shouldBlacklist);

        await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);
      });

      it("should retain 2^255 if the account was blacklisted", async () => {
        await fiatToken.setBalanceAndBlacklistStates(userOne, POW_2_255_BN);
        await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);

        await fiatToken.internal_setBlacklistState(userOne, _shouldBlacklist);

        await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);
      });

      it("should store (2^255 + previous balance) if the account has a balance", async () => {
        await fiatToken.setBalanceAndBlacklistStates(userOne, SEVEN);
        await expectBalanceAndBlacklistStatesToBe(userOne, SEVEN);

        await fiatToken.internal_setBlacklistState(userOne, _shouldBlacklist);

        await expectBalanceAndBlacklistStatesToBe(
          userOne,
          POW_2_255_BN.add(SEVEN)
        );
      });
    });

    context("when _shouldBlacklist is false", () => {
      const _shouldBlacklist = false;

      it("should store 0 if the account was blacklisted", async () => {
        await fiatToken.setBalanceAndBlacklistStates(userOne, POW_2_255_BN);
        await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);

        await fiatToken.internal_setBlacklistState(userOne, _shouldBlacklist);

        await expectBalanceAndBlacklistStatesToBe(userOne, ZERO);
      });

      it("should retain 0 if the account was not blacklisted", async () => {
        await expectBalanceAndBlacklistStatesToBe(userOne, ZERO);

        await fiatToken.internal_setBlacklistState(userOne, _shouldBlacklist);

        await expectBalanceAndBlacklistStatesToBe(userOne, ZERO);
      });

      it("should store previous balance if the account has a balance", async () => {
        await fiatToken.setBalanceAndBlacklistStates(
          userOne,
          POW_2_255_BN.add(SEVEN)
        );
        await expectBalanceAndBlacklistStatesToBe(
          userOne,
          POW_2_255_BN.add(SEVEN)
        );

        await fiatToken.internal_setBlacklistState(userOne, _shouldBlacklist);

        await expectBalanceAndBlacklistStatesToBe(userOne, SEVEN);
      });
    });
  });

  describe("internal_setBalance", () => {
    it("should revert if new balance is greater than or equal to 2^255", async () => {
      await expectBalanceAndBlacklistStatesToBe(userOne, ZERO);

      const newBalance = POW_2_255_BN; // 2^255
      await expectRevert(
        fiatToken.internal_setBalance(userOne, newBalance),
        "FiatTokenV2_2: Balance exceeds (2^255 - 1)"
      );

      await expectBalanceAndBlacklistStatesToBe(userOne, ZERO);
    });

    it("should revert if the account is blacklisted", async () => {
      await fiatToken.setBalanceAndBlacklistStates(userOne, POW_2_255_BN);
      await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);

      const newBalance = SEVEN;
      await expectRevert(
        fiatToken.internal_setBalance(userOne, newBalance),
        "FiatTokenV2_2: Account is blacklisted"
      );

      await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);
    });

    it("should always reset balances to the _balance parameter if new balance is less than 2^255 and account is not blacklisted", async () => {
      const newBalance = POW_2_255_BN.sub(new BN(1)); // 2^255 - 1
      await expectBalanceAndBlacklistStatesToBe(userOne, ZERO);

      // Set to some high value.
      await fiatToken.internal_setBalance(userOne, newBalance);
      await expectBalanceAndBlacklistStatesToBe(userOne, newBalance);

      // Then, choose a lower value, ensuring that it sets to the value.
      await fiatToken.internal_setBalance(userOne, SEVEN);
      await expectBalanceAndBlacklistStatesToBe(userOne, SEVEN);

      // Then, choose a higher value, ensuring that it sets to the value.
      await fiatToken.internal_setBalance(userOne, newBalance);
      await expectBalanceAndBlacklistStatesToBe(userOne, newBalance);
    });
  });

  describe("internal_isBlacklisted", () => {
    it("should return false if the high bit is 0", async () => {
      await fiatToken.setBalanceAndBlacklistStates(userOne, SEVEN);
      expect(await fiatToken.internal_isBlacklisted(userOne)).to.be.false;
    });

    it("should return true if the high bit is 1", async () => {
      await fiatToken.setBalanceAndBlacklistStates(
        userOne,
        POW_2_255_BN.add(SEVEN)
      );
      expect(await fiatToken.internal_isBlacklisted(userOne)).to.be.true;
    });

    it("should not change balanceAndBlacklistState", async () => {
      await fiatToken.setBalanceAndBlacklistStates(userOne, SEVEN);
      await fiatToken.internal_isBlacklisted(userOne);
      await expectBalanceAndBlacklistStatesToBe(userOne, SEVEN);

      await fiatToken.setBalanceAndBlacklistStates(userOne, POW_2_255_BN);
      await fiatToken.internal_isBlacklisted(userOne);
      await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);
    });
  });

  describe("internal_balanceOf", () => {
    it("should return the correct balance when the high bit is 0", async () => {
      await fiatToken.setBalanceAndBlacklistStates(userOne, SEVEN);
      expect((await fiatToken.internal_balanceOf(userOne)).eq(SEVEN)).to.be
        .true;
    });

    it("should return the correct balance when the high bit is 1", async () => {
      await fiatToken.setBalanceAndBlacklistStates(
        userOne,
        POW_2_255_BN.add(SEVEN)
      );
      expect((await fiatToken.internal_balanceOf(userOne)).eq(SEVEN)).to.be
        .true;
    });

    it("should not change balanceAndBlacklistState", async () => {
      await fiatToken.setBalanceAndBlacklistStates(userOne, SEVEN);
      await fiatToken.internal_balanceOf(userOne);
      await expectBalanceAndBlacklistStatesToBe(userOne, SEVEN);

      await fiatToken.setBalanceAndBlacklistStates(userOne, POW_2_255_BN);
      await fiatToken.internal_balanceOf(userOne);
      await expectBalanceAndBlacklistStatesToBe(userOne, POW_2_255_BN);
    });
  });
});
