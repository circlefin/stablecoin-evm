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
    DeployFiatToken
} from "../../../scripts/deploy/deploy-fiat-token.s.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";

// solhint-disable func-name-mixedcase

contract DeployFiatTokenTest is TestUtils {
    DeployFiatToken private deployScript;

    function setUp() public override {
        TestUtils.setUp();

        vm.prank(deployer);
        deployScript = new DeployFiatToken();
        deployScript.setUp();
    }

    function test_deployFiatTokenWithEnvConfigured() public {
        (
            FiatTokenV2_2 v2_2,
            MasterMinter masterMinter,
            FiatTokenProxy proxy
        ) = deployScript.run();

        validateImpl(v2_2);
        validateMasterMinter(masterMinter, address(proxy));
        validateProxy(proxy, address(v2_2), address(masterMinter));
    }

    function test_deployFiatTokenWithPredeployedImpl() public {
        vm.prank(deployer);
        FiatTokenV2_2 predeployedImpl = new FiatTokenV2_2();

        (, MasterMinter masterMinter, FiatTokenProxy proxy) = deployScript
            .deploy(address(predeployedImpl));

        validateMasterMinter(masterMinter, address(proxy));
        validateProxy(proxy, address(predeployedImpl), address(masterMinter));
    }

    function validateProxy(
        FiatTokenProxy proxy,
        address _impl,
        address _masterMinter
    ) internal {
        assertEq(proxy.admin(), proxyAdmin);
        assertEq(proxy.implementation(), _impl);

        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(address(proxy));
        assertEq(proxyAsV2_2.name(), "USDC");
        assertEq(proxyAsV2_2.symbol(), "USDC");
        assertEq(proxyAsV2_2.currency(), "USD");
        assert(proxyAsV2_2.decimals() == 6);
        assertEq(proxyAsV2_2.owner(), owner);
        assertEq(proxyAsV2_2.pauser(), pauser);
        assertEq(proxyAsV2_2.blacklister(), blacklister);
        assertEq(proxyAsV2_2.masterMinter(), _masterMinter);
    }
}
