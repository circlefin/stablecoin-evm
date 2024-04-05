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
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

/**
 * A utility script to set up a minter and burner. It assumes that the
 * master minter owner EOA has been assigned the masterMinter role on the
 * FiatToken proxy.
 *
 * @dev This can only be run on an active deployment of the proxy and
 * implementation
 */
contract SetUpHotMinterAndBurner is Script {
    uint256 private masterMinterOwnerPrivateKey;

    uint256 private mintAllowanceInNormalUnits;
    uint256 private decimals;
    uint256 private mintAllowance;

    address private proxyAddress;
    address private minter;
    address private burner;

    FiatTokenV2_2 proxyAsV2_2;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        masterMinterOwnerPrivateKey = vm.envUint(
            "MASTER_MINTER_OWNER_PRIVATE_KEY"
        );

        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");
        minter = vm.envAddress("MINTER_ADDRESS");
        burner = vm.envAddress("BURNER_ADDRESS");
        mintAllowanceInNormalUnits = vm.envUint(
            "MINT_ALLOWANCE_IN_NORMAL_UNITS"
        );

        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyAddress);
        console.log("MINTER_ADDRESS: '%s'", minter);
        console.log("BURNER_ADDRESS: '%s'", burner);
        console.log(
            "MASTER_MINTER_OWNER: '%s'",
            vm.addr(masterMinterOwnerPrivateKey)
        );
        console.log(
            "MINT_ALLOWANCE_IN_NORMAL_UNITS: '%s'",
            vm.toString(mintAllowanceInNormalUnits)
        );

        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        decimals = proxyAsV2_2.decimals();

        mintAllowance = mintAllowanceInNormalUnits * 10**decimals;
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external {
        console.log(">>>>>>> Configuring Known Minter and Burner <<<<<<<");
        vm.startBroadcast(masterMinterOwnerPrivateKey);

        proxyAsV2_2.configureMinter(minter, mintAllowance);

        proxyAsV2_2.configureMinter(burner, 0);
        vm.stopBroadcast();
    }
}
