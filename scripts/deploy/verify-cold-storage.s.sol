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

pragma solidity 0.8.24;

import "forge-std/console.sol";

import { Script } from "forge-std/Script.sol";
import { ScriptUtils } from "./ScriptUtils.sol";
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

/**
 * A utility script verify the cold storage role transfer
 *
 * @dev This can only be run on an active deployment of the proxy and
 * implementation
 */
contract VerifyColdStorage is Script, ScriptUtils {
    address payable proxyAddress;
    address private prodMinter;
    address private prodBurner;
    address private stgMinter;
    address private stgBurner;
    address private masterMinterContractAddress;
    address private blacklisterAddress;
    address private coldMasterMinterOwnerAddress;
    address private coldOwnerAddress;
    address private coldProxyAdminAddress;
    address private coldPauserAddress;

    address[] private minterControllers;
    address[] private minters;
    uint256[] private minterAllowances;
    uint256 private decimals;

    FiatTokenProxy proxy;
    FiatTokenV2_2 proxyAsV2_2;
    MasterMinter masterMinter;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        proxyAddress = payable(vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS"));

        blacklisterAddress = vm.envAddress("BLACKLISTER_ADDRESS");

        coldMasterMinterOwnerAddress = vm.envAddress(
            "COLD_MASTER_MINTER_OWNER_ADDRESS"
        );
        coldOwnerAddress = vm.envAddress("COLD_OWNER_ADDRESS");
        coldProxyAdminAddress = vm.envAddress("COLD_PROXY_ADMIN_ADDRESS");
        coldPauserAddress = vm.envAddress("COLD_PAUSER_ADDRESS");
        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        (
            minterControllers,
            minters,
            minterAllowances
        ) = _loadMinterConfiguration(vm.envString("MINTERS_FILE_NAME"));

        console.log("Supplied params:");
        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyAddress);
        console.log("BLACKLISTER_ADDRESS: '%s'", blacklisterAddress);
        console.log(
            "MASTER_MINTER_CONTRACT_ADDRESS: '%s'",
            masterMinterContractAddress
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
        masterMinter = MasterMinter(proxyAsV2_2.masterMinter());

        decimals = proxyAsV2_2.decimals();
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external view {
        console.log(
            "\n>>>>>>> Validate the following roles are as expected: <<<<<<<"
        );

        console.log("FiatToken Owner:        %s", proxyAsV2_2.owner());
        require(
            proxyAsV2_2.owner() == coldOwnerAddress,
            "Unexpected FiatToken Owner, should be cold storage owner"
        );

        console.log("Proxy Admin:        %s", proxy.admin());
        require(
            proxy.admin() == coldProxyAdminAddress,
            "Unexpected Proxy Admin, should be the cold storage proxy admin"
        );

        console.log("MasterMinter Role:  %s", proxyAsV2_2.masterMinter());
        require(
            proxyAsV2_2.masterMinter() == masterMinterContractAddress,
            "Unexpected FiatToken masterMinter, should be the MasterMinter contract"
        );

        console.log("MasterMinter Owner: %s", masterMinter.owner());
        require(
            masterMinter.owner() == coldMasterMinterOwnerAddress,
            "Unexpected MasterMinter owner, should be cold storage MasterMinter owner"
        );

        console.log("Blacklister Role:   %s", proxyAsV2_2.blacklister());
        require(
            proxyAsV2_2.blacklister() == blacklisterAddress,
            "Unexpected FiatToken blacklister, should be the hot blacklister address"
        );

        console.log("Pauser Role:        %s", proxyAsV2_2.pauser());
        require(
            proxyAsV2_2.pauser() == coldPauserAddress,
            "Unexpected FiatToken pauser, should be the cold storage pauser"
        );

        console.log(
            "\n>>>>>>> Validate the minter allowances (in major units) are as expected: <<<<<<<"
        );
        for (uint256 i = 0; i < minters.length; i++) {
            uint256 allowance = proxyAsV2_2.minterAllowance(minters[i]) /
                10 ** decimals;
            console.log("Minter: %s, Allowance: %d", minters[i], allowance);
            require(
                allowance == minterAllowances[i],
                "Minter allowance does not match config"
            );
        }
    }
}
