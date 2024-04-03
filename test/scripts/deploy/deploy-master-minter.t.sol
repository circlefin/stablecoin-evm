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
    DeployMasterMinter
} from "../../../scripts/deploy/deploy-master-minter.s.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";

// solhint-disable func-name-mixedcase

contract DeployMasterMinterTest is TestUtils {
    DeployMasterMinter internal deployScript;

    function setUp() public override {
        TestUtils.setUp();

        vm.prank(deployer);
        deployScript = new DeployMasterMinter();
        deployScript.setUp();
    }

    function test_deployMasterMinter() public {
        MasterMinter masterMinter = deployScript.run();

        validateMasterMinter(
            masterMinter,
            vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS")
        );
    }
}
