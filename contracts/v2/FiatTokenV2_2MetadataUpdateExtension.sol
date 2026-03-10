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
pragma solidity 0.8.24;

import { FiatTokenV2_2 } from "./FiatTokenV2_2.sol";

// solhint-disable func-name-mixedcase

/**
 * @title FiatTokenV2_2MetadataUpdateExtension
 * @notice This contract extends the FiatTokenV2_2 contract with a metadata update extension.
 */
contract FiatTokenV2_2MetadataUpdateExtension is FiatTokenV2_2 {
    /// Emitted when the metadata is updated
    event MetadataUpdated(string newName, string newSymbol, string newCurrency);

    /**
     * @notice Updates the name, symbol and currency metadata of the token
     * @param newName The new name of the token
     * @param newSymbol The new symbol of the token
     * @param newCurrency The new currency code of the token
     */
    function updateMetadata(
        string memory newName,
        string memory newSymbol,
        string memory newCurrency
    ) external {
        name = newName;
        symbol = newSymbol;
        currency = newCurrency;

        emit MetadataUpdated(newName, newSymbol, newCurrency);
    }
}
