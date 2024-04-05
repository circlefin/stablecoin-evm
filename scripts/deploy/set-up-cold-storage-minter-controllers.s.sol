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

import "forge-std/console.sol";

import { Script } from "forge-std/Script.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";

/**
 * A utility script to set up controllers in the master
 * minter contract.
 *
 * @dev It assumes that the MasterMinter contract has
 * already been deployed
 */
contract SetUpColdStorageMinterControllers is Script {
    uint256 private masterMinterOwnerPrivateKey;

    address private proxyAddress;
    address private masterMinterContractAddress;
    address private minter;
    address private burner;
    address private minterControllerIncrementer;
    address private minterControllerRemover;
    address private burnerController;

    MasterMinter masterMinter;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        masterMinterOwnerPrivateKey = vm.envUint(
            "MASTER_MINTER_OWNER_PRIVATE_KEY"
        );

        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        minter = vm.envAddress("MINTER_ADDRESS");
        burner = vm.envAddress("BURNER_ADDRESS");
        minterControllerIncrementer = vm.envAddress(
            "MINTER_CONTROLLER_INCREMENTER_ADDRESS"
        );
        minterControllerRemover = vm.envAddress(
            "MINTER_CONTROLLER_REMOVER_ADDRESS"
        );
        burnerController = vm.envAddress("BURNER_CONTROLLER_ADDRESS");

        console.log(
            "MASTER_MINTER_CONTRACT_ADDRESS: '%s'",
            masterMinterContractAddress
        );
        console.log("MINTER_ADDRESS: '%s'", minter);
        console.log("BURNER_ADDRESS: '%s'", burner);
        console.log(
            "MINTER_CONTROLLER_INCREMENTER_ADDRESS: '%s'",
            minterControllerIncrementer
        );
        console.log(
            "MINTER_CONTROLLER_REMOVER_ADDRESS: '%s'",
            minterControllerRemover
        );
        console.log("BURNER_CONTROLLER_ADDRESS: '%s'", burnerController);
        console.log(
            "MASTER_MINTER_OWNER_ADDRESS: '%s'",
            vm.addr(masterMinterOwnerPrivateKey)
        );

        masterMinter = MasterMinter(masterMinterContractAddress);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external {
        console.log(
            ">>>>>>> Configuring Known Cold Storage Controllers of Minters And Burners <<<<<<<"
        );
        vm.startBroadcast(masterMinterOwnerPrivateKey);

        masterMinter.configureController(minterControllerIncrementer, minter);
        masterMinter.configureController(minterControllerRemover, minter);

        masterMinter.configureController(burnerController, burner);

        vm.stopBroadcast();

        console.log(
            "MINTER_CONTROLLER_INCREMENTER (%s) controls",
            vm.toString(minterControllerIncrementer),
            vm.toString(masterMinter.getWorker(minterControllerIncrementer))
        );
        console.log(
            "MINTER_CONTROLLER_REMOVER (%s) controls",
            vm.toString(minterControllerRemover),
            vm.toString(masterMinter.getWorker(minterControllerRemover))
        );
        console.log(
            "BURNER_CONTROLLER (%s) controls",
            vm.toString(burnerController),
            vm.toString(masterMinter.getWorker(burnerController))
        );
    }
}
