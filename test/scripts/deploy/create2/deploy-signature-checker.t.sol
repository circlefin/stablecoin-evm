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
import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { DeploySignatureChecker } from "../../../../scripts/deploy/create2/deploy-signature-checker.s.sol";
import { AddressUtils } from "../../../../scripts/deploy/create2/AddressUtils.sol";

// solhint-disable func-name-mixedcase

contract DeploySignatureCheckerTest is TestUtils {
    DeploySignatureChecker public deployScript;

    function setUp() public override {
        TestUtils.setUp();

        vm.prank(deployer);
        deployScript = new DeploySignatureChecker();
        deployScript.setUp();
    }

    function test_deploySignatureCheckerToExpectedAddress() public {
        // Assume the script is called by the deployer keypair
        vm.prank(deployer);

        address factoryAddress = vm.envAddress(
            "CREATE2_FACTORY_CONTRACT_ADDRESS"
        );
        address expectedSignatureCheckerAddress = new AddressUtils()
            .computeSignatureCheckerAddress(chainId, factoryAddress);
        address signatureCheckerAddress = deployScript.run();

        assertTrue(
            signatureCheckerAddress == expectedSignatureCheckerAddress,
            "SignatureChecker deployed to unexpected address"
        );
    }
}
