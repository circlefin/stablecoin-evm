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
        assertEq(proxyAsV2_2.isMinter(minter), false);
        assertEq(proxyAsV2_2.isMinter(burner), false);
    }

    function test_SetUpHotMinterAndBurnerPositiveTest() public {

            SetUpHotMinterAndBurner setUpHotMinterAndBurnerScript
         = new SetUpHotMinterAndBurner();
        setUpHotMinterAndBurnerScript.setUp();
        setUpHotMinterAndBurnerScript.run();

        assertEq(proxyAsV2_2.isMinter(minter), true);
        assertEq(proxyAsV2_2.minterAllowance(minter), mintAllowance);
        assertEq(proxyAsV2_2.isMinter(burner), true);
        assertEq(proxyAsV2_2.minterAllowance(burner), 0);
    }
}
