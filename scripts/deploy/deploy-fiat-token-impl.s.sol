/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import { DeployImpl } from "./DeployImpl.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

/**
 * A utility script to directly deploy Fiat Token contract with the latest implementation
 *
 * @dev The proxy needs to be deployed before the master minter; the proxy cannot
 * be initialized until the master minter is deployed.
 */
contract DeployFiatToken is Script, DeployImpl {
    address private immutable THROWAWAY_ADDRESS = address(1);

    address private impl;

    uint256 private deployerPrivateKey;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        impl = address(0);

        deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
    }

    /**
     * @dev For testing only: splitting deploy logic into an internal function to expose for testing
     */
    function _deploy(address _impl)
        internal
        returns (
            FiatTokenV2_2
        )
    {
        vm.startBroadcast(deployerPrivateKey);

        // If there is an existing implementation contract,
        // we can simply point the newly deployed proxy contract to it.
        // Otherwise, deploy the latest implementation contract code to the network.
        FiatTokenV2_2 fiatTokenV2_2 = getOrDeployImpl(_impl);

        vm.stopBroadcast();

        return (fiatTokenV2_2);
    }

    /**
     * @dev For testing only: Helper function that runs deploy script with a specific implementation address
     */
    function deploy(address _impl)
        external
        returns (
            FiatTokenV2_2
        )
    {
        return _deploy(_impl);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run()
        external
        returns (
            FiatTokenV2_2
        )
    {
        return _deploy(impl);
    }
}
