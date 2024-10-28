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

import { MockFiatTokenWithEditableChainIdInstance } from "../../@types/generated";
import { makeDomainSeparator, linkLibraryToTokenContract } from "../helpers";
import { HARDHAT_ACCOUNTS } from "../helpers/constants";

const MockFiatTokenWithEditableChainId = artifacts.require(
  "MockFiatTokenWithEditableChainId"
);

describe("MockFiatTokenWithEditableChainId", () => {
  const name = "USDC";
  const version = "2";
  const [, , lostAndFound] = HARDHAT_ACCOUNTS;
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];

  let fiatToken: MockFiatTokenWithEditableChainIdInstance;

  beforeEach(async () => {
    await linkLibraryToTokenContract(MockFiatTokenWithEditableChainId);
    fiatToken = await MockFiatTokenWithEditableChainId.new();

    await fiatToken.initialize(
      name,
      "USDC",
      "USD",
      6,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner
    );
    await fiatToken.initializeV2("USDC", { from: fiatTokenOwner });
    await fiatToken.initializeV2_1(lostAndFound);
    await fiatToken.initializeV2_2([], "USDCUSDC");
  });

  describe("DOMAIN_SEPARATOR", () => {
    it("domain separator gets recalculated after chain ID changes", async () => {
      const chainId: number = (await fiatToken.chainId()).toNumber();
      const originalDomainSeparator: string = await fiatToken.DOMAIN_SEPARATOR();
      assert.equal(
        originalDomainSeparator,
        makeDomainSeparator(name, version, chainId, fiatToken.address)
      );

      const newChainId = 1234;
      await fiatToken.setChainId(newChainId);

      const newDomainSeparator: string = await fiatToken.DOMAIN_SEPARATOR();

      assert.equal(
        newDomainSeparator,
        makeDomainSeparator(name, version, newChainId, fiatToken.address)
      );
    });
  });
});
