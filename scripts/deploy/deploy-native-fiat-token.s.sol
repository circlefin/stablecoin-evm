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

import { console } from "forge-std/console.sol";
import { Script } from "forge-std/Script.sol";
import { NativeFiatTokenV2_2 } from "../../contracts/v2/NativeFiatTokenV2_2.sol";

/**
 * @notice Script to deploy NativeFiatTokenV2_2 implementation
 * @dev Usage:
 *
 * Deploy implementation:
 *   forge script scripts/deploy/deploy-native-fiat-token.s.sol --rpc-url <network> --sig "run()" --broadcast
 *
 * Environment Variables:
 *   DEPLOYER_PRIVATE_KEY - Private key for deployment
 */
contract DeployNativeFiatToken is Script {
    /**
     * @notice Main function - deploy NativeFiatTokenV2_2 implementation
     */
    function run() external returns (NativeFiatTokenV2_2) {
        return deployImplementation();
    }

    /**
     * @notice Deploy NativeFiatTokenV2_2 implementation
     */
    function deployImplementation() public returns (NativeFiatTokenV2_2) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy NativeFiatTokenV2_2 implementation
        NativeFiatTokenV2_2 impl = new NativeFiatTokenV2_2();

        console.log(
            "NativeFiatTokenV2_2 implementation deployed at:",
            address(impl)
        );

        vm.stopBroadcast();

        return impl;
    }
}
