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

import "forge-std/console.sol";

import { Script } from "forge-std/Script.sol";
import { ScriptUtils } from "./ScriptUtils.sol";
import { Blacklistable } from "../../contracts/v1/Blacklistable.sol";

/**
 * A utility script to verify that a list of addresses have been
 * blacklisted
 */
contract VerifyBlacklist is Script, ScriptUtils {
    address private proxyAddress;
    string private blacklistFileName;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");
        blacklistFileName = vm.envString("BLACKLIST_FILE_NAME");

        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyAddress);
        console.log("BLACKLIST_FILE_NAME: '%s'", blacklistFileName);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external {
        console.log(">>>>>>> Starting Blacklist Validation <<<<<<<");

        Blacklistable proxyAsBlacklistable = Blacklistable(proxyAddress);

        address[] memory blacklistArray = _loadAccountsToBlacklist(
            blacklistFileName
        );
        console.log(
            "# of items in %s:",
            blacklistFileName,
            vm.toString(blacklistArray.length)
        );

        // make sure proxy address itself is blacklisted
        require(
            proxyAsBlacklistable.isBlacklisted(proxyAddress),
            string(
                abi.encodePacked(
                    "Proxy Contract ",
                    vm.toString(proxyAddress),
                    " should have been blacklisted during initialization but is not."
                )
            )
        );

        uint256 validatedCount = 0;
        for (uint256 i = 0; i < blacklistArray.length; i++) {
            require(
                proxyAsBlacklistable.isBlacklisted(blacklistArray[i]),
                string(
                    abi.encodePacked(
                        vm.toString(blacklistArray[i]),
                        " is missing from the blacklist"
                    )
                )
            );
            console.log("%s is blacklisted", vm.toString(blacklistArray[i]));
            validatedCount++;
        }
        console.log(
            "Validated %s addresses. No missing addresses found.",
            vm.toString(validatedCount)
        );
    }
}
