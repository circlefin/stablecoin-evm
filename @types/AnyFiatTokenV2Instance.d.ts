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

import { FiatTokenV2Instance } from "./generated/FiatTokenV2";
import { FiatTokenV2_1Instance } from "./generated/FiatTokenV2_1";
import { FiatTokenV2_2Instance } from "./generated/FiatTokenV2_2";
import { FiatTokenCeloV2_2Instance } from "./generated/FiatTokenCeloV2_2";
import { NativeFiatTokenV2_2Instance } from "./generated/NativeFiatTokenV2_2";
import { MockNativeFiatTokenWithExposedFunctionsInstance } from "./generated/MockNativeFiatTokenWithExposedFunctions";
import { FiatTokenInjectiveV2_2Instance } from "./generated/FiatTokenInjectiveV2_2";

export interface V2_2ExtendedInterface {
  permit?: typeof FiatTokenV2Instance.permit;
  transferWithAuthorization?: typeof FiatTokenV2Instance.transferWithAuthorization;
  receiveWithAuthorization?: typeof FiatTokenV2Instance.receiveWithAuthorization;
  cancelAuthorization?: typeof FiatTokenV2Instance.cancelAuthorization;
}

export interface FiatTokenV2_2InstanceExtended
  extends FiatTokenV2_2Instance, V2_2ExtendedInterface {}

export interface FiatTokenCeloV2_2InstanceExtended
  extends FiatTokenCeloV2_2Instance, V2_2ExtendedInterface {
  mint: typeof FiatTokenV2Instance.mint;
}

export interface NativeFiatTokenV2_2InstanceExtended
  extends NativeFiatTokenV2_2Instance, V2_2ExtendedInterface {}

export interface MockNativeFiatTokenWithExposedFunctionsInstanceExtended
  extends
    MockNativeFiatTokenWithExposedFunctionsInstance,
    V2_2ExtendedInterface {}

export interface FiatTokenInjectiveV2_2InstanceExtended
  extends FiatTokenInjectiveV2_2Instance, V2_2ExtendedInterface {}

// TODO: Add NativeFiatTokenV2_2InstanceExtended and MockNativeFiatTokenWithExposedFunctionsInstanceExtended
// back to AnyFiatTokenV2Instance once NativeFiatToken typechain types are verified with flattened FiatTokenV2_2
export type AnyFiatTokenV2Instance =
  | FiatTokenV2Instance
  | FiatTokenV2_1Instance
  | FiatTokenV2_2InstanceExtended
  | FiatTokenCeloV2_2InstanceExtended
  | FiatTokenInjectiveV2_2InstanceExtended;
