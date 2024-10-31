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
    SetUpHotMinterAndBurner
} from "../../../scripts/deploy/set-up-hot-minter-and-burner.s.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";

// solhint-disable func-name-mixedcase

contract SetUpHotMinterAndBurnerTest is TestUtils {
    address proxyAddress;

    FiatTokenV2_2 proxyAsV2_2;

    function setUp() public override {
        TestUtils.setUp();

        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");

        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
    }

    function test_SetUpHotMinterAndBurnerNegativeTest() public {
        assertEq(proxyAsV2_2.isMinter(prodMinter), false);
        assertEq(proxyAsV2_2.isMinter(prodBurner), false);
        assertEq(proxyAsV2_2.isMinter(stgMinter), false);
        assertEq(proxyAsV2_2.isMinter(stgBurner), false);
    }

    function test_SetUpHotMinterAndBurnerProdPositiveTest() public {

            SetUpHotMinterAndBurner setUpHotMinterAndBurnerScript
         = new SetUpHotMinterAndBurner();
        setUpHotMinterAndBurnerScript.setUp();
        setUpHotMinterAndBurnerScript.setUpHotMinterAndBurner("PROD");

        assertEq(proxyAsV2_2.isMinter(prodMinter), true);
        assertEq(proxyAsV2_2.minterAllowance(prodMinter), prodMintAllowance);
        assertEq(proxyAsV2_2.isMinter(prodBurner), true);
        assertEq(proxyAsV2_2.minterAllowance(prodBurner), 0);

        // no staging side effects
        assertEq(proxyAsV2_2.isMinter(stgMinter), false);
        assertEq(proxyAsV2_2.isMinter(stgBurner), false);
    }

    function test_SetUpHotMinterAndBurnerStgPositiveTest() public {

            SetUpHotMinterAndBurner setUpHotMinterAndBurnerScript
         = new SetUpHotMinterAndBurner();
        setUpHotMinterAndBurnerScript.setUp();
        setUpHotMinterAndBurnerScript.setUpHotMinterAndBurner("STG");

        assertEq(proxyAsV2_2.isMinter(stgMinter), true);
        assertEq(proxyAsV2_2.minterAllowance(stgMinter), stgMintAllowance);
        assertEq(proxyAsV2_2.isMinter(stgBurner), true);
        assertEq(proxyAsV2_2.minterAllowance(stgBurner), 0);

        // no prod side effects
        assertEq(proxyAsV2_2.isMinter(prodMinter), false);
        assertEq(proxyAsV2_2.isMinter(prodBurner), false);
    }
}
