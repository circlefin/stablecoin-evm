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
pragma experimental ABIEncoderV2;

import { Test } from "forge-std/Test.sol";
import { FiatTokenV2_2MetadataUpdateExtension } from "../../contracts/v2/FiatTokenV2_2MetadataUpdateExtension.sol";

contract FiatTokenV2_2MetadataExtensionTest is Test {
    FiatTokenV2_2MetadataUpdateExtension private metadataExtension;

    event MetadataUpdated(string name, string symbol, string currency);

    function setUp() public {
        metadataExtension = new FiatTokenV2_2MetadataUpdateExtension();
    }

    function test_updateMetadata_updatesMetadataSuccessfully() public {
        string memory newName = "New Token Name";
        string memory newSymbol = "NTN";
        string memory newCurrency = "NEW";
        vm.expectEmit(false, false, false, true);
        emit MetadataUpdated(newName, newSymbol, newCurrency);

        metadataExtension.updateMetadata(newName, newSymbol, newCurrency);

        assertEq(
            metadataExtension.name(),
            newName,
            "Name not updated correctly"
        );
        assertEq(
            metadataExtension.symbol(),
            newSymbol,
            "Symbol not updated correctly"
        );
        assertEq(
            metadataExtension.currency(),
            newCurrency,
            "Currency not updated correctly"
        );
    }
}
