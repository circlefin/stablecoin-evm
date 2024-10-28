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
  bufferFromHexString,
  hexStringFromBuffer,
  makeDomainSeparator,
} from "../helpers";
import { MessageHashUtilsTestInstance } from "../../@types/generated";

const MessageHashUtils = artifacts.require("MessageHashUtilsTest");

describe("MessageHashUtils", function () {
  context("toTypedDataHash", function () {
    it("returns the digest correctly", async function () {
      const messageHashUtils: MessageHashUtilsTestInstance = await MessageHashUtils.new();
      const structhash: string = web3.utils.randomHex(32);
      const domainSeparator: string = makeDomainSeparator(
        "USDC",
        "2",
        1,
        messageHashUtils.address
      );
      expect(
        await messageHashUtils.toTypedDataHash(domainSeparator, structhash)
      ).to.equal(hashTypedData(domainSeparator, structhash));
    });
  });
});

function hashTypedData(domainSeparator: string, structHash: string): string {
  return web3.utils.keccak256(
    hexStringFromBuffer(
      Buffer.concat(
        ["0x1901", domainSeparator, structHash].map((str) =>
          bufferFromHexString(str)
        )
      )
    )
  );
}
