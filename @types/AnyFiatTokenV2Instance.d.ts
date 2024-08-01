/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
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
import { OptimismMintableFiatTokenV2_2Instance } from "./generated/OptimismMintableFiatTokenV2_2";

export interface FiatTokenV2_2InstanceExtended extends FiatTokenV2_2Instance {
  permit?: typeof FiatTokenV2Instance.permit;
  transferWithAuthorization?: typeof FiatTokenV2Instance.transferWithAuthorization;
  receiveWithAuthorization?: typeof FiatTokenV2Instance.receiveWithAuthorization;
  cancelAuthorization?: typeof FiatTokenV2Instance.cancelAuthorization;
}

export interface OptimismMintableFiatTokenV2_2InstanceExtended
  extends OptimismMintableFiatTokenV2_2Instance {
  permit?: typeof FiatTokenV2Instance.permit;
  transferWithAuthorization?: typeof FiatTokenV2Instance.transferWithAuthorization;
  receiveWithAuthorization?: typeof FiatTokenV2Instance.receiveWithAuthorization;
  cancelAuthorization?: typeof FiatTokenV2Instance.cancelAuthorization;
}

export type AnyFiatTokenV2Instance =
  | FiatTokenV2Instance
  | FiatTokenV2_1Instance
  | FiatTokenV2_2InstanceExtended
  | OptimismMintableFiatTokenV2_2InstanceExtended;
