/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2023 CENTRE SECZ
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
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
