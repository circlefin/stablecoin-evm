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

import { EIP712TestInstance } from "../../@types/generated";
import { wordlist } from "ethereum-cryptography/bip39/wordlists/english";
import sampleSize from "lodash/sampleSize";
import { makeDomainSeparator } from "../helpers";

const EIP712Test = artifacts.require("EIP712Test");

describe("EIP712", () => {
  let eip712: EIP712TestInstance;
  let chainId: number;
  let randomName: string;
  let randomVersion: string;
  let domainSeparator: string;

  beforeEach(async () => {
    eip712 = await EIP712Test.new();
    chainId = await web3.eth.getChainId();

    randomName = sampleSize(wordlist, 3).join(" ");
    randomVersion = (Math.floor(Math.random() * 10) + 1).toString();
    domainSeparator = makeDomainSeparator(
      randomName,
      randomVersion,
      chainId,
      eip712.address
    );
  });

  describe("makeDomainSeparator", () => {
    it("generates a EIP712 domain separator", async () => {
      expect(
        await eip712.makeDomainSeparator(randomName, randomVersion)
      ).to.equal(domainSeparator);
    });
  });
});
