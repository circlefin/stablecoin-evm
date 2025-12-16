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

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";
import { ScriptUtils } from "./ScriptUtils.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

/**
 * @notice Script to configure minters and their controllers
 * @dev This script reads minter configuration from a JSON file and sets up the corresponding
 * minter controllers and allowances in the MasterMinter contract. It requires the master minter
 * owner's private key and the master minter contract address to be set in the environment.
 */
contract ConfigureMinters is Script, ScriptUtils {
    uint256 private masterMinterOwnerKey;

    address private masterMinterContractAddress;

    address private proxyAddress;

    address[] private minterControllers;

    address[] private minters;

    uint256[] private minterAllowances;

    uint256 private decimals;

    FiatTokenV2_2 proxyAsV2_2;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        masterMinterOwnerKey = vm.envUint("MASTER_MINTER_OWNER_PRIVATE_KEY");
        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");
        (
            minterControllers,
            minters,
            minterAllowances
        ) = _loadMinterConfiguration(vm.envString("MINTERS_FILE_NAME"));

        console.log(
            "MASTER_MINTER_CONTRACT_ADDRESS: '%s'",
            masterMinterContractAddress
        );
        console.log(
            "MASTER_MINTER_OWNER_ADDRESS: '%s'",
            vm.addr(masterMinterOwnerKey)
        );
        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyAddress);

        for (uint256 i = 0; i < minterControllers.length; i++) {
            console.log(
                "Controller: %s, Minter: %s, Allowance: %d",
                minterControllers[i],
                minters[i],
                minterAllowances[i]
            );
        }

        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        decimals = proxyAsV2_2.decimals();
    }

    /**
     * @notice Configures minters and their controllers
     * @dev This function performs the following steps for each minter:
     * 1. Temporarily configures the master minter owner as a controller for the minter
     * 2. Uses the temporary controller access to set the minter's allowance
     * 3. Configures the intended minter controller for the minter
     * 4. Finally removes the master minter owner's temporary controller access
     */
    function run() external {
        console.log(
            ">>>>>>> Configuring minters and minter controllers <<<<<<<"
        );

        vm.startBroadcast(masterMinterOwnerKey);
        MasterMinter masterMinterContract = MasterMinter(
            masterMinterContractAddress
        );
        address masterMinterOwner = vm.addr(masterMinterOwnerKey);

        for (uint256 i = 0; i < minters.length; i++) {
            masterMinterContract.configureController(
                masterMinterOwner,
                minters[i]
            );
            masterMinterContract.configureMinter(
                minterAllowances[i] * 10 ** decimals
            );
            masterMinterContract.configureController(
                minterControllers[i],
                minters[i]
            );
        }

        masterMinterContract.removeController(masterMinterOwner);

        vm.stopBroadcast();
    }
}
