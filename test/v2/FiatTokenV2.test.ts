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

import { FiatTokenV2Instance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { linkLibraryToTokenContract } from "../helpers";
import { HARDHAT_ACCOUNTS } from "../helpers/constants";
import { behavesLikeFiatTokenV2 } from "./v2.behavior";

const FiatTokenV2 = artifacts.require("FiatTokenV2");

describe("FiatTokenV2", () => {
  let fiatToken: FiatTokenV2Instance;
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenV2);
  });

  beforeEach(async () => {
    fiatToken = await FiatTokenV2.new();
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

  behavesLikeFiatTokenV2(2, () => fiatToken);
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV2,
    version: 2,
  });
});
