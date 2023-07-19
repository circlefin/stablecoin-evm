/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018 zOS Global Limited.
 *
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
 */

pragma solidity 0.6.12;

import { FiatTokenV2_2 } from "../v2/FiatTokenV2_2.sol";

/**
 * @title MockFiatTokenWithEditableChainId
 * @dev A mock class to simulate chain ID change as a result of blockchain forks
 */
contract MockFiatTokenWithEditableChainId is FiatTokenV2_2 {
    uint256 private _internalChainId = 1;

    /**
     * @dev Allow chain ID to be set to any arbitrary values.
     */
    function setChainId(uint256 newChainId) external {
        _internalChainId = newChainId;
    }

    /**
     * @return uint256 the interal chain ID previous set with user input
     */
    function _chainId() internal override view returns (uint256) {
        return _internalChainId;
    }

    /**
     * @dev Helper to allow reading current chain ID from test cases.
     * @return uint256 the interal chain ID previous set with user input
     */
    function chainId() external view returns (uint256) {
        return _chainId();
    }
}
