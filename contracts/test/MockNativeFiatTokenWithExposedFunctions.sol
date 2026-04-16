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

import { NativeFiatTokenV2_2 } from "../v2/NativeFiatTokenV2_2.sol";
import { MockNativeCoinAuthority } from "./NativeFiatToken/MockNativeCoinAuthority.sol";
import { MockNativeCoinControl } from "./NativeFiatToken/MockNativeCoinControl.sol";

/**
 * @title MockNativeFiatTokenWithExposedFunctions
 * @dev A mock contract that extends NativeFiatTokenV2_2 and exposes its internal functions for testing
 */
contract MockNativeFiatTokenWithExposedFunctions is NativeFiatTokenV2_2 {
    MockNativeCoinAuthority private constant MOCK_AUTHORITY =
        MockNativeCoinAuthority(0x1800000000000000000000000000000000000000);

    MockNativeCoinControl private constant MOCK_COIN_CONTROL =
        MockNativeCoinControl(0x1800000000000000000000000000000000000001);

    /**
     * @dev Exposes the internal to18Decimals function for testing
     * @param amount The amount in source decimals
     * @param factor The factor of decimals conversion
     * @return The amount in 18 decimals
     */
    function exposedTo18Decimals(
        uint256 amount,
        uint256 factor
    ) external pure returns (uint256) {
        return _to18Decimals(amount, factor);
    }

    /**
     * @dev Exposes the internal from18Decimals function for testing
     * @param amount The amount in 18 decimals
     * @param factor The factor of decimals conversion
     * @return The amount in source decimals
     */
    function exposedFrom18Decimals(
        uint256 amount,
        uint256 factor
    ) external pure returns (uint256) {
        return _from18Decimals(amount, factor);
    }

    /**
     * @dev Internal implementation of balanceOf that retrieves the account's
     * native coin balance and converts it from 18 decimals to the sourceDecimals (6).
     * Unlike the parent contract implementation, this directly uses the chain's
     * native balance rather than internal state variables.
     * @param _account  The address of the account.
     * @return The converted balance in sourceDecimals.
     */
    function _balanceOf(
        address _account
    ) internal view virtual override returns (uint256) {
        return
            _from18Decimals(
                MOCK_AUTHORITY.balanceOf(_account),
                DECIMALS_SCALING_FACTOR
            );
    }

    /**
     * @dev Internal implementation of transfer that delegates the actual
     * token movement to the NATIVE_COIN_AUTHORITY contract. This overrides
     * the parent contract implementation to:
     * 1. Convert the value from sourceDecimals (6) to 18 decimals for native coin
     * 2. Use the authority contract instead of modifying internal state variables
     * 3. Still emit standard ERC20 Transfer events for compatibility
     * @param from  Payer's address.
     * @param to    Payee's address.
     * @param value Transfer amount in sourceDecimals.
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        require(from != address(0), "transfer from the zero address");
        require(to != address(0), "transfer to the zero address");
        uint256 valueIn18Decimals = _to18Decimals(
            value,
            DECIMALS_SCALING_FACTOR
        );
        require(
            valueIn18Decimals <= MOCK_AUTHORITY.balanceOf(from),
            "transfer amount exceeds balance"
        );
        require(
            MOCK_AUTHORITY.transfer(from, to, valueIn18Decimals),
            "Native transfer failed"
        );
        emit Transfer(from, to, value);
    }
}
