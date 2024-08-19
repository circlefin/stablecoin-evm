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

import "forge-std/console.sol";

import { Script } from "forge-std/Script.sol";
import { ScriptUtils } from "./ScriptUtils.sol";
import { Blacklistable } from "../../contracts/v1/Blacklistable.sol";

/**
 * A utility script to blacklist a list of sanctioned addresses
 *
 * @dev This can only be run on an active deployment of the proxy and
 * implementation
 */
contract BlacklistSanctionsList is Script, ScriptUtils {
    address private proxyAddress;
    string private blacklistFileName;

    uint256 private blacklisterPrivateKey;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");
        blacklistFileName = vm.envString("BLACKLIST_FILE_NAME");

        blacklisterPrivateKey = vm.envUint("BLACKLISTER_PRIVATE_KEY");

        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyAddress);
        console.log("BLACKLIST_FILE_NAME: '%s'", blacklistFileName);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external {
        console.log("Blacklister: '%s'", vm.addr(blacklisterPrivateKey));

        Blacklistable proxyAsBlacklistable = Blacklistable(proxyAddress);

        address[] memory addressesToBlacklist = _loadAccountsToBlacklist(
            blacklistFileName
        );

        for (uint256 i = 0; i < addressesToBlacklist.length; i++) {
            vm.startBroadcast(blacklisterPrivateKey);
            proxyAsBlacklistable.blacklist(addressesToBlacklist[i]);
            vm.stopBroadcast();
            console.log(
                "Blacklisted status for %s:",
                vm.toString(addressesToBlacklist[i]),
                vm.toString(
                    proxyAsBlacklistable.isBlacklisted(addressesToBlacklist[i])
                )
            );
        }

        console.log(
            "Blacklisted %s addresses in total",
            vm.toString(addressesToBlacklist.length)
        );
    }
}
