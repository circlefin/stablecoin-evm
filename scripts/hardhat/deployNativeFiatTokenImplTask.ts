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

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployNativeFiatTokenV2_2Implementation } from "./deployNativeFiatTokenImpl";

task(
  "deployNativeFiatTokenV2_2Impl",
  "Deploys the Native FiatTokenV2_2 implementation contract"
).setAction(taskAction);

async function taskAction(_: unknown, _hre: HardhatRuntimeEnvironment) {
  const result = await deployNativeFiatTokenV2_2Implementation();

  console.log(result);
}
