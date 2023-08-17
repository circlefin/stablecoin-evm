/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2023, Circle Internet Financial, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { behavesLikeRescuable } from "./Rescuable.behavior";
import {
  FiatTokenV11Instance,
  RescuableInstance,
} from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";

const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");

contract("FiatTokenV1_1", (accounts) => {
  let fiatToken: FiatTokenV11Instance;

  beforeEach(async () => {
    fiatToken = await FiatTokenV1_1.new();
    const owner = accounts[0];
    await fiatToken.initialize(
      "USD Coin",
      "USDC",
      "USD",
      6,
      owner,
      owner,
      owner,
      owner
    );
  });

  behavesLikeRescuable(() => fiatToken as RescuableInstance, accounts);
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV1_1,
    version: 1.1,
    accounts,
  });
});
