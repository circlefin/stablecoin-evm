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

import { RescuableInstance } from "../../@types/generated";
import { behavesLikeRescuable } from "./Rescuable.behavior";
import { ZERO_ADDRESS } from "../helpers/constants";

const Rescuable = artifacts.require("Rescuable");

describe("Rescuable", () => {
  let rescuable: RescuableInstance;

  beforeEach(async () => {
    rescuable = await Rescuable.new();
  });

  behavesLikeRescuable(() => rescuable);

  it("initially sets rescuer to be the zero address", async () => {
    const rescuer = await rescuable.rescuer();
    expect(rescuer).to.equal(ZERO_ADDRESS);
  });
});
