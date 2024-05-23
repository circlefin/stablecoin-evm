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

import { FiatTokenFeeAdapterV1 } from "../../v2/celo/FiatTokenFeeAdapterV1.sol";

// solhint-disable func-name-mixedcase

/**
 * @dev This contract is the same as FiatTokenFeeAdapterV1, except, for testing,
 * it allows us to call the internal upscaling and downscaling functions and
 * allows us to override the call originator on debiting and crediting, as Web3JS
 * and Ganache do not allow us to impersonate 0x0 (vm.prank) for tests.
 */
contract MockFiatTokenFeeAdapterWithExposedFunctions is FiatTokenFeeAdapterV1 {
    address private _vmCallerAddress;

    modifier onlyCeloVm() override {
        require(
            msg.sender == _vmCallerAddress,
            "FiatTokenFeeAdapterV1: caller is not VM"
        );
        _;
    }

    function setVmCallerAddress(address newVmCallerAddress) external {
        _vmCallerAddress = newVmCallerAddress;
    }

    function internal_debitedValue() external view returns (uint256) {
        return _debitedValue;
    }

    function internal_upscale(uint256 value) external view returns (uint256) {
        return _upscale(value);
    }

    function internal_downscale(uint256 value) external view returns (uint256) {
        return _downscale(value);
    }
}
