/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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

import { FiatTokenCeloV2_2 } from "../../v2/celo/FiatTokenCeloV2_2.sol";

// solhint-disable func-name-mixedcase

/**
 * @dev This contract is the same as FiatTokenCeloV2_2, except, for testing,
 * it allows us to call internal sensitive functions for testing. These
 * external test functions are prefixed with "internal_" to differentiate
 * them from the main internal functions.
 */
contract MockFiatTokenCeloWithExposedFunctions is FiatTokenCeloV2_2 {
    function internal_debitedValue() external view returns (uint256) {
        return _debitedValue();
    }

    function internal_transferReservedGas(
        address from,
        address to,
        uint256 value
    ) external onlyFeeCaller {
        _transferReservedGas(from, to, value);
    }

    function internal_setBalance(address account, uint256 balance) external {
        _setBalance(account, balance);
    }
}
