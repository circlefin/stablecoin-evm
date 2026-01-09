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
  teardownCosmosClient,
  getErc20Denom,
  getDenomMetadata,
  getTotalSupply,
} from "./helpers/client";
import { fundAccount, getFaucetBalance } from "./helpers/faucet";
import {
  setupFiatTokenInjectiveV2_2,
  teardownEvmClient,
  FiatTokenInjectiveV2_2Contract,
} from "./helpers/evm";
import { PrivateKey } from "@injectivelabs/sdk-ts";

const INJ_DENOM = "inj";
const FAUCET_AMOUNT = "100000000000000000000"; // 100 INJ

describe("Injective Integration Tests", function () {
  before(async function () {
    const ready = await isNodeReady();
    if (!ready) {
      throw new Error("Injective localnet is not ready.");
    }
  });

  after(() => {
    teardownCosmosClient();
    teardownEvmClient();
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

  describe("FiatTokenInjectiveV2_2 EVM Contract", () => {
    let fiatToken: FiatTokenInjectiveV2_2Contract;
    let proxyAddress: string;
    let erc20Denom: string;

    before(async () => {
      const deployment = await setupFiatTokenInjectiveV2_2();

      fiatToken = deployment.fiatToken;
      proxyAddress = deployment.proxyAddress;
      erc20Denom = getErc20Denom(proxyAddress);
    });

    it("should have deployed fiat token", () => {
      expect(proxyAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(fiatToken).to.not.be.undefined;
    });

    describe("EVM Queries", () => {
      it("should return totalSupply of 0 when no tokens minted", async () => {
        const totalSupply = await fiatToken.totalSupply();
        expect(totalSupply).to.equal(BigInt(0));
      });

      it("should have correct token metadata", async () => {
        const name = await fiatToken.name();
        const symbol = await fiatToken.symbol();
        const decimals = await fiatToken.decimals();

        expect(name).to.equal("USDC");
        expect(symbol).to.equal("USDC");
        expect(decimals).to.equal(BigInt(6));
      });
    });

    describe("Bank Module Queries", () => {
      it("should have registered metadata in bank module", async () => {
        const metadata = await getDenomMetadata(erc20Denom);

        expect(metadata).to.not.be.null;
        expect(metadata?.name).to.equal("USDC");
        expect(metadata?.symbol).to.equal("USDC");
        expect(metadata?.decimals).to.equal(6);
      });

      it("should return totalSupply of 0 from bank module when no tokens minted", async () => {
        const totalSupply = await getTotalSupply(erc20Denom);
        expect(totalSupply).to.equal("0");
      });

      it("should match EVM and bank module total supply", async () => {
        const evmTotalSupply = await fiatToken.totalSupply();
        const bankTotalSupply = await getTotalSupply(erc20Denom);

        expect(bankTotalSupply).to.equal(evmTotalSupply.toString());
      });
    });
  });
});
