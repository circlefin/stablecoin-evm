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
pragma solidity 0.6.12;

import { FiatTokenV2_1 } from "../../../v2/FiatTokenV2_1.sol";
import { V2UpgraderHelper } from "./V2UpgraderHelper.sol";
import { V2_2UpgraderHelper } from "./V2_2UpgraderHelper.sol";
import {
    FiatTokenV2_2MetadataUpdateExtension
} from "../../../v2/FiatTokenV2_2MetadataUpdateExtension.sol";

/**
 * @title MetadataUpdateUpgraderHelper
 * @dev Enables MetadataUpdateUpgrader to update token metadata (name, symbol, currency)
 * before renouncing the proxy admin role. (Proxy admins cannot call delegated methods).
 */
contract MetadataUpdateUpgraderHelper is V2_2UpgraderHelper {
    /**
     * @notice Constructor
     * @param fiatTokenProxy    Address of the FiatTokenProxy contract
     */
    constructor(address fiatTokenProxy)
        public
        V2_2UpgraderHelper(fiatTokenProxy)
    {}

    /**
     * @notice Updates the token metadata (name, symbol, and currency)
     * @param newName The new name for the token
     * @param newSymbol The new symbol for the token
     * @param newCurrency The new currency code for the token
     */
    function updateMetadata(
        string memory newName,
        string memory newSymbol,
        string memory newCurrency
    ) external {
        FiatTokenV2_2MetadataUpdateExtension(address(_proxy)).updateMetadata(
            newName,
            newSymbol,
            newCurrency
        );
    }
}
