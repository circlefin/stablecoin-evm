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

// solhint-disable func-name-mixedcase

contract BlacklistSanctionsListTest is TestUtils {
    address private proxyAddress;

    function setUp() public override {
        TestUtils.setUp();

        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");
    }

    function test_BlacklistSanctionsListNegativeTest() public {
        validateAddressesBlacklistedState(proxyAddress, false);
    }

    function test_BlacklistSanctionsListPositiveTest() public {
        BlacklistSanctionsList blacklistScript = new BlacklistSanctionsList();
        blacklistScript.setUp();
        blacklistScript.run();

        validateAddressesBlacklistedState(proxyAddress, true);
    }
}
