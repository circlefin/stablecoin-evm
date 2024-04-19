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
pragma experimental ABIEncoderV2; // needed for compiling older solc versions: https://github.com/foundry-rs/foundry/issues/4376

import { TestUtils } from "./TestUtils.sol";
import {
    BlacklistSanctionsList
} from "../../../scripts/deploy/blacklist-sanctions-list.s.sol";
import { Blacklistable } from "../../../contracts/v1/Blacklistable.sol";

// solhint-disable func-name-mixedcase

contract BlacklistSanctionsListTest is TestUtils {
    Blacklistable private proxyAsBlacklistable;

    function setUp() public override {
        TestUtils.setUp();

        proxyAsBlacklistable = Blacklistable(
            vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS")
        );
    }

    function test_BlacklistSanctionsListNegativeTest() public {
        for (uint256 i = 0; i < accountsToBlacklist.length; i++) {
            assertEq(
                proxyAsBlacklistable.isBlacklisted(accountsToBlacklist[i]),
                false
            );
        }
    }

    function test_BlacklistSanctionsListPositiveTest() public {
        BlacklistSanctionsList blacklistScript = new BlacklistSanctionsList();
        blacklistScript.setUp();
        blacklistScript.run();

        for (uint256 i = 0; i < accountsToBlacklist.length; i++) {
            assertEq(
                proxyAsBlacklistable.isBlacklisted(accountsToBlacklist[i]),
                true
            );
        }
    }
}
