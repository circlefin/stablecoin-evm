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

import { FiatTokenV2_2 } from "../FiatTokenV2_2.sol";
import { IBankModule } from "../../interface/injective/IBankModule.sol";

contract FiatTokenInjectiveV2_2 is FiatTokenV2_2 {
    address private constant BANK_PRECOMPILE_ADDRESS =
        0x0000000000000000000000000000000000000064;

    function _bankPrecompile() internal pure returns (IBankModule) {
        return IBankModule(BANK_PRECOMPILE_ADDRESS);
    }

    /**
     * @notice Initialize the bank module metadata
     */
    // solhint-disable-next-line func-name-mixedcase
    function initializeInjV2_2() external {
        require(
            _initializedVersion == 3,
            "FiatTokenInjectiveV2_2: not initialized yet"
        );
        _bankPrecompile().setMetadata(name, symbol, decimals);
    }

    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return _bankPrecompile().balanceOf(account, address(this));
    }

    function totalSupply() external view override returns (uint256) {
        return _bankPrecompile().totalSupply(address(this));
    }
}
