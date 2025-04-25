/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

/**
 * A utility script to assign various roles to cold storage
 * addresses.
 */
contract ColdStorageTransfer is Script {
    uint256 private ownerPrivateKey;
    uint256 private proxyAdminPrivateKey;
    uint256 private masterMinterOwnerPrivateKey;

    uint256 private mintAllowanceUnits;
    uint256 private mintAllowance;

    address payable proxyAddress;
    address private masterMinterContractAddress;
    address private coldMasterMinterOwnerAddress;
    address private coldOwnerAddress;
    address private coldProxyAdminAddress;
    address private coldPauserAddress;

    FiatTokenProxy proxy;
    FiatTokenV2_2 proxyAsV2_2;
    MasterMinter masterMinter;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        ownerPrivateKey = vm.envUint("OWNER_PRIVATE_KEY");
        proxyAdminPrivateKey = vm.envUint("PROXY_ADMIN_PRIVATE_KEY");
        masterMinterOwnerPrivateKey = vm.envUint(
            "MASTER_MINTER_OWNER_PRIVATE_KEY"
        );

        proxyAddress = payable(vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS"));
        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        coldMasterMinterOwnerAddress = vm.envAddress(
            "COLD_MASTER_MINTER_OWNER_ADDRESS"
        );
        coldOwnerAddress = vm.envAddress("COLD_OWNER_ADDRESS");
        coldProxyAdminAddress = vm.envAddress("COLD_PROXY_ADMIN_ADDRESS");
        coldPauserAddress = vm.envAddress("COLD_PAUSER_ADDRESS");

        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyAddress);
        console.log(
            "MASTER_MINTER_CONTRACT_ADDRESS: '%s'",
            masterMinterContractAddress
        );
        console.log(
            "MASTER_MINTER_OWNER: '%s'",
            vm.addr(masterMinterOwnerPrivateKey)
        );
        console.log(
            "COLD_MASTER_MINTER_OWNER_ADDRESS: '%s'",
            coldMasterMinterOwnerAddress
        );
        console.log("COLD_OWNER_ADDRESS: '%s'", coldOwnerAddress);
        console.log("COLD_PROXY_ADMIN_ADDRESS: '%s'", coldProxyAdminAddress);
        console.log("COLD_PAUSER_ADDRESS: '%s'", coldPauserAddress);

        proxy = FiatTokenProxy(proxyAddress);
        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        masterMinter = MasterMinter(masterMinterContractAddress);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external {
        console.log(">>>>>>> Reassigning ownership to cold storage <<<<<<<");

        // Migrate master minter on token to master minter contract.
        vm.broadcast(ownerPrivateKey);
        proxyAsV2_2.updateMasterMinter(masterMinterContractAddress);
        console.log(
            "Reassigned token master minter to the MasterMinter contract",
            masterMinterContractAddress
        );

        // Assign the pauser role to the cold pauser if not already done.
        if (proxyAsV2_2.pauser() != coldPauserAddress) {
            vm.broadcast(ownerPrivateKey);
            proxyAsV2_2.updatePauser(coldPauserAddress);
            console.log(
                "Assigned pauser role to the cold pauser",
                coldPauserAddress
            );
        }

        // Reassign master minter contract's owner to cold owner.
        vm.broadcast(masterMinterOwnerPrivateKey);
        masterMinter.transferOwnership(coldMasterMinterOwnerAddress);
        console.log(
            "Reassigned master minter contract owner role to cold owner",
            coldMasterMinterOwnerAddress
        );

        // Reassign proxy admin to cold admin.
        vm.broadcast(proxyAdminPrivateKey);
        proxy.changeAdmin(coldProxyAdminAddress);
        console.log(
            "Reassigned proxy contract admin role to cold admin",
            coldProxyAdminAddress
        );

        // Reassign the token owner.
        vm.broadcast(ownerPrivateKey);
        proxyAsV2_2.transferOwnership(coldOwnerAddress);
        console.log(
            "Reassigned FiatToken owner role to cold owner",
            coldOwnerAddress
        );
    }
}
