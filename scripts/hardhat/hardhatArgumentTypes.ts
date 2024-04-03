/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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

import { ethers } from "ethers";
import { types } from "hardhat/config";
import { HardhatError } from "hardhat/internal/core/errors";
import { ERRORS } from "hardhat/internal/core/errors-list";
import { CLIArgumentType } from "hardhat/types";

/**
 * Extended argument list from @see {@link https://github.com/NomicFoundation/hardhat/blob/f6eb9365fdc23033f41a8ff7744c9398c8e2459f/packages/hardhat-core/src/internal/core/params/argumentTypes.ts}
 */
const address: CLIArgumentType<string> = {
  name: "address",
  parse: (_, strValue) => ethers.getAddress(strValue),
  validate: (argName, value) => {
    if (!ethers.isAddress(value)) {
      throw new HardhatError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
        value,
        name: argName,
        type: address.name,
      });
    }
  },
};

const oneOf = (values: unknown[]): CLIArgumentType<string> => ({
  name: "oneOf",
  parse: (_, strValue) => strValue,
  validate: (argName, value) => {
    if (!values.includes(value)) {
      throw new HardhatError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
        value,
        name: argName,
        type: oneOf.name,
      });
    }
  },
});

export const hardhatArgumentTypes = {
  ...types,
  address,
  oneOf,
};
