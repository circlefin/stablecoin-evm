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

import { FiatTokenV2_2 } from "../v2/FiatTokenV2_2.sol";

// solhint-disable func-name-mixedcase

/**
 * @title MockFiatTokenWithEditableBalanceAndBlacklistStates
 * @dev A mock class that allows the internal balanceAndBlacklistStates to be manipulated in tests.
 */
contract MockFiatTokenWithEditableBalanceAndBlacklistStates is FiatTokenV2_2 {
    /**
     * @dev Allows the balanceAndBlacklistStates to be manipulated. This
     * enables us to properly test the ERC20 functionalities.
     */
    function setBalanceAndBlacklistStates(address _account, uint256 _state)
        external
    {
        balanceAndBlacklistStates[_account] = _state;
    }

    /**
     * @dev Allows the balanceAndBlacklistStates to be read as plain values.
     */
    function getBalanceAndBlacklistStates(address _account)
        external
        view
        returns (uint256)
    {
        return balanceAndBlacklistStates[_account];
    }

    /**
     * @dev Exposes the internal function for unit testing.
     */
    function internal_setBlacklistState(address _account, bool _shouldBlacklist)
        external
    {
        _setBlacklistState(_account, _shouldBlacklist);
    }

    /**
     * @dev Exposes the internal function for unit testing.
     */
    function internal_setBalance(address _account, uint256 _balance) external {
        _setBalance(_account, _balance);
    }

    /**
     * @dev Exposes the internal function for unit testing.
     */
    function internal_isBlacklisted(address _account)
        external
        view
        returns (bool)
    {
        return _isBlacklisted(_account);
    }

    /**
     * @dev Exposes the internal function for unit testing.
     */
    function internal_balanceOf(address _account)
        external
        view
        returns (uint256)
    {
        return _balanceOf(_account);
    }
}
