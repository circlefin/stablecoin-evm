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
pragma experimental ABIEncoderV2; // needed for compiling older solc versions: https://github.com/foundry-rs/foundry/issues/4376

import { TestUtils } from "./TestUtils.sol";
import {
    DeployImplAndUpgrader
} from "../../../scripts/deploy/deploy-impl-and-upgrader.s.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import { V2_2Upgrader } from "../../../contracts/v2/upgrader/V2_2Upgrader.sol";

// solhint-disable func-name-mixedcase

contract DeployImplAndUpgraderTest is TestUtils {
    DeployImplAndUpgrader private deployScript;

    function setUp() public override {
        TestUtils.setUp();

        vm.prank(deployer);
        deployScript = new DeployImplAndUpgrader();
        deployScript.setUp();
    }

    function test_DeployImplAndUpgraderWithAllEnvConfigured() public {
        (FiatTokenV2_2 v2_2, V2_2Upgrader upgrader) = deployScript.run();

        validateImpl(v2_2);
        validateUpgrader(
            upgrader,
            vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS"),
            address(v2_2)
        );
    }

    function test_DeployImplAndUpgraderWithPredeployedImpl() public {
        vm.prank(deployer);
        FiatTokenV2_2 predeployedImpl = new FiatTokenV2_2();

        (, V2_2Upgrader upgrader) = deployScript.deploy(
            address(predeployedImpl)
        );

        validateUpgrader(
            upgrader,
            vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS"),
            address(predeployedImpl)
        );
    }

    function validateUpgrader(
        V2_2Upgrader upgrader,
        address proxy,
        address impl
    ) internal {
        assertEq(upgrader.implementation(), impl);
        assertEq(upgrader.proxy(), proxy);
        assertEq(upgrader.newProxyAdmin(), proxyAdmin);
        assertEq(upgrader.owner(), vm.addr(deployerPrivateKey));
        assertEq(upgrader.accountsToBlacklist(), accountsToBlacklist);
    }
}
