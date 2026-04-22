/**
 * Copyright 2026 Circle Internet Group, Inc. All rights reserved.
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

import { TestUtils } from "../TestUtils.sol";
import { FiatTokenProxy } from "../../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenInjectiveV2_2 } from "../../../../contracts/v2/injective/FiatTokenInjectiveV2_2.sol";
import { MasterMinter } from "../../../../contracts/minting/MasterMinter.sol";
import { DeployFiatTokenInjective } from "../../../../scripts/deploy/injective/deploy-fiat-token-injective.s.sol";

contract DeployFiatTokenInjectiveTest is TestUtils {
    DeployFiatTokenInjective private deployScript;

    function setUp() public override {
        TestUtils.setUp();

        vm.prank(deployer);
        deployScript = new DeployFiatTokenInjective();
        deployScript.setUp();
    }

    function test_deployFiatTokenWithEnvConfigured() public {
        (
            FiatTokenInjectiveV2_2 v2_2,
            MasterMinter masterMinter,
            FiatTokenProxy proxy
        ) = deployScript.run();

        validateMasterMinter(masterMinter, address(proxy));
        assertEq(proxy.admin(), proxyAdmin);
        assertEq(proxy.implementation(), address(v2_2));
    }

    function test_deployFiatTokenWithPredeployedImpl() public {
        vm.prank(deployer);
        FiatTokenInjectiveV2_2 predeployedImpl = new FiatTokenInjectiveV2_2();

        (, MasterMinter masterMinter, FiatTokenProxy proxy) = deployScript
            .deploy(address(predeployedImpl));

        validateMasterMinter(masterMinter, address(proxy));
        assertEq(proxy.admin(), proxyAdmin);
        assertEq(proxy.implementation(), address(predeployedImpl));
    }
}
