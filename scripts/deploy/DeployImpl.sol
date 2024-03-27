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

import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

/**
 * @notice A utility contract that exposes a re-useable getOrDeployImpl function.
 */
contract DeployImpl {
    address private immutable THROWAWAY_ADDRESS = address(1);

    /**
     * @notice helper function that either
     * 1) deploys the implementation contract if the input is the zero address, or
     * 2) loads an instance of an existing contract when input is not the zero address.
     *
     * @param impl configured of the implementation contract, where address(0) represents a new instance should be deployed
     * @return FiatTokenV2_2 newly deployed or loaded instance
     */
    function getOrDeployImpl(address impl) internal returns (FiatTokenV2_2) {
        FiatTokenV2_2 fiatTokenV2_2;

        if (impl == address(0)) {
            fiatTokenV2_2 = new FiatTokenV2_2();

            // Initializing the implementation contract with dummy values here prevents
            // the contract from being reinitialized later on with different values.
            // Dummy values can be used here as the proxy contract will store the actual values
            // for the deployed token.
            fiatTokenV2_2.initialize(
                "",
                "",
                "",
                0,
                THROWAWAY_ADDRESS,
                THROWAWAY_ADDRESS,
                THROWAWAY_ADDRESS,
                THROWAWAY_ADDRESS
            );
            fiatTokenV2_2.initializeV2("");
            fiatTokenV2_2.initializeV2_1(THROWAWAY_ADDRESS);
            fiatTokenV2_2.initializeV2_2(new address[](0), "");
        } else {
            fiatTokenV2_2 = FiatTokenV2_2(impl);
        }

        return fiatTokenV2_2;
    }
}
