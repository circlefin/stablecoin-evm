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
pragma experimental ABIEncoderV2; // needed for compiling older solc versions: https://github.com/foundry-rs/foundry/issues/4376

import { TestUtils } from "../TestUtils.sol";
import { AddressUtils } from "../../../../scripts/deploy/create2/AddressUtils.sol";
import { DeployMasterMinterCreate2 } from "../../../../scripts/deploy/create2/deploy-master-minter-create2.s.sol";
import { MasterMinter } from "../../../../contracts/minting/MasterMinter.sol";

// solhint-disable func-name-mixedcase

contract DeployMasterMinterCreate2Test is TestUtils {
    DeployMasterMinterCreate2 private deployScript;
    AddressUtils private addressUtils;
    address private factoryAddress;

    function setUp() public override {
        TestUtils.setUp();

        vm.prank(deployer);
        deployScript = new DeployMasterMinterCreate2();
        deployScript.setUp();

        addressUtils = new AddressUtils();
        factoryAddress = vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS");
    }

    function test_deployMasterMinterWithEnvConfigured() public {
        MasterMinter masterMinter = deployScript.run();

        validateStandaloneMasterMinter(masterMinter);

        assertEq(
            address(masterMinter),
            addressUtils.computeMasterMinterAddress(
                chainId,
                factoryAddress,
                tokenSymbol
            )
        );
    }
}
