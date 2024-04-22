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

import { TestUtils } from "./../TestUtils.sol";
import {
    DeployFiatToken
} from "../../../../scripts/deploy/deploy-fiat-token.s.sol";
import {
    DeployFeeAdapter
} from "../../../../scripts/deploy/celo/deploy-fee-adapter.s.sol";

import { FiatTokenProxy } from "../../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../../contracts/v2/FiatTokenV2_2.sol";
import {
    FiatTokenCeloV2_2
} from "../../../../contracts/v2/celo/FiatTokenCeloV2_2.sol";
import {
    FiatTokenFeeAdapterProxy
} from "../../../../contracts/v2/celo/FiatTokenFeeAdapterProxy.sol";
import {
    FiatTokenFeeAdapterV1
} from "../../../../contracts/v2/celo/FiatTokenFeeAdapterV1.sol";
import { MasterMinter } from "../../../../contracts/minting/MasterMinter.sol";

// solhint-disable func-name-mixedcase

contract DeployFeeAdapterTest is TestUtils {
    DeployFeeAdapter private deployScript;

    function setUp() public override {
        TestUtils.setUp();

        vm.prank(deployer);
        deployScript = new DeployFeeAdapter();
        deployScript.setUp();
    }

    function test_deployFeeAdapter() public {
        (
            FiatTokenFeeAdapterV1 v1,
            FiatTokenFeeAdapterProxy proxy
        ) = deployScript.run();

        validateImpl(v1);
        validateProxy(proxy, address(v1));
    }

    function validateImpl(FiatTokenFeeAdapterV1 impl) internal {
        assert(impl.adapterDecimals() == 18);
        assert(impl.tokenDecimals() == 6);
        assert(impl.upscaleFactor() == 1000000000000);
    }

    function validateProxy(FiatTokenFeeAdapterProxy proxy, address impl)
        internal
    {
        assertEq(proxy.admin(), proxyAdmin);
        assertEq(proxy.implementation(), impl);

        FiatTokenFeeAdapterV1 proxyAsV1 = FiatTokenFeeAdapterV1(address(proxy));
        assert(proxyAsV1.adapterDecimals() == 18);
        assert(proxyAsV1.tokenDecimals() == 6);
        assert(proxyAsV1.upscaleFactor() == 1000000000000);
    }
}
