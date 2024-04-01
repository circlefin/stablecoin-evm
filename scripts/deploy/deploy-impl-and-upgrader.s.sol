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

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import { ScriptUtils } from "./ScriptUtils.sol";
import { DeployImpl } from "./DeployImpl.sol";
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";
import { V2_2Upgrader } from "../../contracts/v2/upgrader/V2_2Upgrader.sol";

/**
 * A utility script to deploy the latest fiat token implementation and
 * an upgrader contract that updates fiat token use the latest implementation
 */
contract DeployImplAndUpgrader is Script, DeployImpl, ScriptUtils {
    string private newTokenSymbol;
    string private blacklistFileName;
    address private impl;
    address payable private proxyContractAddress;
    address private proxyAdmin;
    address private lostAndFound;
    address[] private accountsToBlacklist;

    uint256 private deployerPrivateKey;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        impl = vm.envOr("FIAT_TOKEN_IMPLEMENTATION_ADDRESS", address(0));

        newTokenSymbol = vm.envString("TOKEN_SYMBOL");
        proxyContractAddress = payable(
            vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS")
        );
        proxyAdmin = vm.envAddress("PROXY_ADMIN_ADDRESS");
        lostAndFound = vm.envOr(
            "LOST_AND_FOUND_ADDRESS",
            vm.envAddress("OWNER_ADDRESS")
        );

        blacklistFileName = vm.envString("BLACKLIST_FILE_NAME");
        accountsToBlacklist = _loadAccountsToBlacklist(blacklistFileName);

        deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        console.log("FIAT_TOKEN_IMPLEMENTATION_ADDRESS: '%s'", impl);
        console.log("TOKEN_SYMBOL: '%s'", newTokenSymbol);
        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyContractAddress);
        console.log("PROXY_ADMIN_ADDRESS: '%s'", proxyAdmin);
        console.log("LOST_AND_FOUND_ADDRESS: '%s'", lostAndFound);
        console.log("BLACKLIST_FILE_NAME: '%s'", blacklistFileName);
    }

    /**
     * @dev For testing only: splitting deploy logic into an internal function to expose for testing
     */
    function _deploy(address _impl)
        internal
        returns (FiatTokenV2_2, V2_2Upgrader)
    {
        vm.startBroadcast(deployerPrivateKey);

        FiatTokenV2_2 fiatTokenV2_2 = getOrDeployImpl(_impl);

        V2_2Upgrader v2_2Upgrader = new V2_2Upgrader(
            FiatTokenProxy(proxyContractAddress),
            fiatTokenV2_2,
            proxyAdmin,
            accountsToBlacklist,
            newTokenSymbol
        );

        vm.stopBroadcast();
        return (fiatTokenV2_2, v2_2Upgrader);
    }

    /**
     * @dev For testing only: Helper function that runs deploy script with a specific implementation address
     */
    function deploy(address _impl)
        external
        returns (FiatTokenV2_2, V2_2Upgrader)
    {
        return _deploy(_impl);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external returns (FiatTokenV2_2, V2_2Upgrader) {
        return _deploy(impl);
    }
}
