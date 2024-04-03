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

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";

/**
 * A utility script to deploy a standslone MasterMinter contract
 */
contract DeployMasterMinter is Script {
    address payable private proxyContractAddress;
    address private masterMinterOwner;
    uint256 private deployerPrivateKey;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        proxyContractAddress = payable(
            vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS")
        );
        masterMinterOwner = vm.envAddress("MASTER_MINTER_OWNER_ADDRESS");

        deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyContractAddress);
        console.log("MASTER_MINTER_OWNER_ADDRESS: '%s'", masterMinterOwner);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external returns (MasterMinter) {
        vm.startBroadcast(deployerPrivateKey);

        // Now that the proxy contract has been deployed, we can deploy the master minter.
        MasterMinter masterMinter = new MasterMinter(proxyContractAddress);

        // Change the master minter to be owned by the master minter owner
        masterMinter.transferOwnership(masterMinterOwner);

        vm.stopBroadcast();

        return masterMinter;
    }
}
