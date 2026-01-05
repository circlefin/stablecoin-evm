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

pragma solidity 0.8.24;

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import "forge-std/Script.sol";
import { AddressUtils } from "./AddressUtils.sol";
import { ICreate2Factory } from "../../../contracts/interface/ICreate2Factory.sol";
import { SignatureChecker } from "../../../contracts/util/SignatureChecker.sol";

/**
 * A utility script that generates the deployment transaction for the SignatureChecker library contract
 */
contract DeploySignatureChecker is Script, AddressUtils {
    address private deployer;
    address private factory;

    uint256 private chainId;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        factory = vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS");

        chainId = vm.envUint("CHAIN_ID");

        console.log("DEPLOYER_ADDRESS: '%s'", deployer);
        console.log("CREATE2_FACTORY_CONTRACT_ADDRESS: '%s'", factory);
        console.log("CHAIN_ID: '%s'", chainId);
    }

    /**
     * @notice internal function to deploy SignatureChecker using Create2Factory
     */
    function _deploySignatureChecker() internal returns (address) {
        vm.startBroadcast(deployer);
        address signatureCheckerAddress = ICreate2Factory(factory).deploy(
            0,
            signatureCheckerSalt(chainId),
            signatureCheckerCreationCode()
        );
        vm.stopBroadcast();

        return signatureCheckerAddress;
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() public returns (address) {
        return _deploySignatureChecker();
    }
}
