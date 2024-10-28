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
