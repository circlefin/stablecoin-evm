/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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
pragma experimental ABIEncoderV2;

import "forge-std/Test.sol"; // solhint-disable no-global-import
import { TestUtils } from "./TestUtils.sol";
import { ConfigureMinters } from "../../../scripts/deploy/configure-minters.s.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";

// solhint-disable func-name-mixedcase

contract SetUpConfigureMintersTest is TestUtils {
    uint256 private masterMinterOwnerKey;

    address masterMinterContractAddress;

    address proxyAddress;

    FiatTokenV2_2 proxyAsV2_2;

    ConfigureMinters configureMintersScript = new ConfigureMinters();

    MasterMinter masterMinter;

    function setUp() public override {
        TestUtils.setUp();

        masterMinterOwnerKey = vm.envUint("MASTER_MINTER_OWNER_PRIVATE_KEY");
        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");
        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        vm.setEnv(
            "MINTERS_FILE_NAME",
            "test/scripts/deploy/testdata/test.minters.json"
        );

        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        vm.broadcast(ownerPrivateKey);
        proxyAsV2_2.updateMasterMinter(masterMinterContractAddress);
        masterMinter = MasterMinter(masterMinterContractAddress);
    }

    function test_ConfigureMintersNegativeTest() public {
        assertEq(masterMinter.getWorker(minterControllers[0]), address(0));
        assertEq(masterMinter.getWorker(minterControllers[1]), address(0));
        assertEq(masterMinter.getWorker(minterControllers[2]), address(0));

        assertEq(proxyAsV2_2.isMinter(minters[0]), false);
        assertEq(proxyAsV2_2.isMinter(minters[1]), false);
        assertEq(proxyAsV2_2.isMinter(minters[2]), false);
        assertEq(proxyAsV2_2.minterAllowance(minters[0]), 0);
        assertEq(proxyAsV2_2.minterAllowance(minters[1]), 0);
        assertEq(proxyAsV2_2.minterAllowance(minters[2]), 0);

        assertEq(masterMinter.getWorker(masterMinterOwner), address(0));
    }

    function test_ConfigureMintersPositiveTest() public {
        configureMintersScript.setUp();
        configureMintersScript.run();

        assertEq(masterMinter.getWorker(minterControllers[0]), minters[0]);
        assertEq(masterMinter.getWorker(minterControllers[1]), minters[1]);
        assertEq(masterMinter.getWorker(minterControllers[2]), minters[2]);

        assertEq(proxyAsV2_2.isMinter(minters[0]), true);
        assertEq(proxyAsV2_2.isMinter(minters[1]), true);
        assertEq(proxyAsV2_2.isMinter(minters[2]), true);
        assertEq(proxyAsV2_2.minterAllowance(minters[0]), minterAllowances[0]);
        assertEq(proxyAsV2_2.minterAllowance(minters[1]), minterAllowances[1]);
        assertEq(proxyAsV2_2.minterAllowance(minters[2]), minterAllowances[2]);

        assertEq(masterMinter.getWorker(masterMinterOwner), address(0));
    }
}
