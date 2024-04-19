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
    SetUpColdStorageMinterControllers
} from "../../../scripts/deploy/set-up-cold-storage-minter-controllers.s.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";

// solhint-disable func-name-mixedcase

contract SetUpColdStorageMinterControllersTest is TestUtils {
    address masterMinterContractAddress;
    SetUpColdStorageMinterControllers minterControllersScript = new SetUpColdStorageMinterControllers();

    MasterMinter masterMinter;

    function setUp() public override {
        TestUtils.setUp();

        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        masterMinter = MasterMinter(masterMinterContractAddress);
    }

    function test_SetUpColdStorageMinterControllersNegativeTest() public {
        assertEq(
            masterMinter.getWorker(prodMinterControllerIncrementer),
            address(0)
        );
        assertEq(
            masterMinter.getWorker(prodMinterControllerRemover),
            address(0)
        );
        assertEq(masterMinter.getWorker(prodBurnerController), address(0));
        assertEq(
            masterMinter.getWorker(stgMinterControllerIncrementer),
            address(0)
        );
        assertEq(
            masterMinter.getWorker(stgMinterControllerRemover),
            address(0)
        );
        assertEq(masterMinter.getWorker(stgBurnerController), address(0));
    }

    function test_SetUpColdStorageMinterControllersProdPositiveTest() public {
        minterControllersScript.setUp();
        minterControllersScript.setUpColdStorageMinterControllers("PROD");

        assertEq(
            masterMinter.getWorker(prodMinterControllerIncrementer),
            prodMinter
        );
        assertEq(
            masterMinter.getWorker(prodMinterControllerRemover),
            prodMinter
        );
        assertEq(masterMinter.getWorker(prodBurnerController), prodBurner);

        // no staging side effects
        assertEq(
            masterMinter.getWorker(stgMinterControllerIncrementer),
            address(0)
        );
        assertEq(
            masterMinter.getWorker(stgMinterControllerRemover),
            address(0)
        );
        assertEq(masterMinter.getWorker(stgBurnerController), address(0));
    }

    function test_SetUpColdStorageMinterControllersStgPositiveTest() public {
        minterControllersScript.setUp();
        minterControllersScript.setUpColdStorageMinterControllers("STG");

        assertEq(
            masterMinter.getWorker(stgMinterControllerIncrementer),
            stgMinter
        );
        assertEq(masterMinter.getWorker(stgMinterControllerRemover), stgMinter);
        assertEq(masterMinter.getWorker(stgBurnerController), stgBurner);

        // no prod side effects
        assertEq(
            masterMinter.getWorker(prodMinterControllerIncrementer),
            address(0)
        );
        assertEq(
            masterMinter.getWorker(prodMinterControllerRemover),
            address(0)
        );
        assertEq(masterMinter.getWorker(prodBurnerController), address(0));
    }
}
