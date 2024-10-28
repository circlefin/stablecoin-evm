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

pragma solidity 0.6.12;

import { FiatTokenV1 } from "../v1/FiatTokenV1.sol";

/**
 * @title UpgradedFiatTokenNewFieldsTest
 * @dev ERC20 Token backed by fiat reserves
 */
contract UpgradedFiatTokenNewFieldsTest is FiatTokenV1 {
    bool public newBool;
    address public newAddress;
    uint256 public newUint;
    bool internal initializedV2;

    function initialize(
        string calldata tokenName,
        string calldata tokenSymbol,
        string calldata tokenCurrency,
        uint8 tokenDecimals,
        address newMasterMinter,
        address newPauser,
        address newBlacklister,
        address newOwner,
        bool _newBool,
        address _newAddress,
        uint256 _newUint
    ) external {
        super.initialize(
            tokenName,
            tokenSymbol,
            tokenCurrency,
            tokenDecimals,
            newMasterMinter,
            newPauser,
            newBlacklister,
            newOwner
        );
        initV2(_newBool, _newAddress, _newUint);
    }

    function initV2(
        bool _newBool,
        address _newAddress,
        uint256 _newUint
    ) public {
        require(!initializedV2, "contract is already initialized");
        newBool = _newBool;
        newAddress = _newAddress;
        newUint = _newUint;
        initializedV2 = true;
    }
}
