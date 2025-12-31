/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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

import { expect } from "chai";
import {
  isNodeReady,
  getBalance,
  sendTokens,
  teardown,
} from "./helpers/client";
import { fundAccount, getFaucetBalance } from "./helpers/faucet";
import { PrivateKey } from "@injectivelabs/sdk-ts";

const INJ_DENOM = "inj";
const FAUCET_AMOUNT = "100000000000000000000"; // 100 INJ
const SEND_AMOUNT = "1000000000000000000"; // 1 INJ

describe("Injective Integration Tests", function () {
  before(async function () {
    const ready = await isNodeReady();
    if (!ready) {
      throw new Error("Injective localnet is not ready.");
    }
  });

  after(() => {
    teardown();
  });

  describe("Faucet Functionality", () => {
    it("should have sufficient faucet balance", async () => {
      const balance = await getFaucetBalance();
      expect(BigInt(balance) > BigInt(0)).to.be.true;
    });

    it("should fund a new account with INJ from faucet", async () => {
      const recipientKey = PrivateKey.generate().privateKey;
      const recipientAddress = recipientKey.toBech32();

      const result = await fundAccount(recipientAddress);
      expect(result.code).to.equal(0);

      const balance = await getBalance(recipientAddress, INJ_DENOM);
      expect(balance).to.equal(FAUCET_AMOUNT);
    });
  });

  describe("Native INJ Transfer", () => {
    let senderKey: PrivateKey;
    let senderAddress: string;
    let recipientAddress: string;

    beforeEach(async () => {
      senderKey = PrivateKey.generate().privateKey;
      const recipientKey = PrivateKey.generate().privateKey;

      senderAddress = senderKey.toBech32();
      recipientAddress = recipientKey.toBech32();

      await fundAccount(senderAddress);
    });

    it("should send INJ from one account to another", async () => {
      // Get initial balances
      const initialRecipientBalance = await getBalance(
        recipientAddress,
        INJ_DENOM
      );
      expect(initialRecipientBalance).to.equal("0");

      // Send tokens
      const result = await sendTokens(
        senderKey,
        recipientAddress,
        SEND_AMOUNT,
        INJ_DENOM
      );
      expect(result.code).to.equal(0);

      // Verify recipient received tokens
      const finalRecipientBalance = await getBalance(
        recipientAddress,
        INJ_DENOM
      );
      expect(finalRecipientBalance).to.equal(SEND_AMOUNT);
    });
  });
});
