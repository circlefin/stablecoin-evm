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

pragma solidity 0.8.24;

import { TestUtils } from "./TestUtils.sol";
import { BlacklistSanctionsList } from "../../../scripts/deploy/blacklist-sanctions-list.s.sol";
import { VerifyBlacklist } from "../../../scripts/deploy/verify-blacklist.s.sol";
import { Blacklistable } from "../../../contracts/v1/Blacklistable.sol";

// solhint-disable func-name-mixedcase

contract VerifyBlacklistTest is TestUtils {
    VerifyBlacklist private verifyBlacklistScript;
    Blacklistable proxyAsBlacklistable;

    function setUp() public override {
        TestUtils.setUp();

        proxyAsBlacklistable = Blacklistable(
            vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS")
        );

        verifyBlacklistScript = new VerifyBlacklist();
        verifyBlacklistScript.setUp();
    }

    function test_VerifyBlacklistNegativeTest() public {
        vm.expectRevert(
            "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf is missing from the blacklist"
        );
        verifyBlacklistScript.run();
    }

    function test_VerifyBlacklistNegativeProxyTest() public {
        BlacklistSanctionsList blacklistScript = new BlacklistSanctionsList();
        blacklistScript.setUp();
        blacklistScript.run();

        // un-blacklist the proxy address, which should cause the script to fail
        vm.prank(blacklister);
        proxyAsBlacklistable.unBlacklist(address(proxyAsBlacklistable));

        vm.expectRevert(
            abi.encodePacked(
                "Proxy Contract ",
                vm.toString(address(proxyAsBlacklistable)),
                " should have been blacklisted during initialization but is not."
            )
        );
        verifyBlacklistScript.run();
    }

    function test_VerifyBlacklistPositiveTest() public {
        BlacklistSanctionsList blacklistScript = new BlacklistSanctionsList();
        blacklistScript.setUp();
        blacklistScript.run();

        verifyBlacklistScript.run();
    }
}
