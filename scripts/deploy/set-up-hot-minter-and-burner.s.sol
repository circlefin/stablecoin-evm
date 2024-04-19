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

import { ScriptUtils } from "./ScriptUtils.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

/**
 * A utility script to set up a minter and burner. It assumes that the
 * master minter owner EOA has been assigned the masterMinter role on the
 * FiatToken proxy.
 *
 * @dev This can only be run on an active deployment of the proxy and
 * implementation
 */
contract SetUpHotMinterAndBurner is ScriptUtils {
    uint256 private masterMinterOwnerPrivateKey;

    uint256 private mintAllowanceInNormalUnits;
    uint256 private decimals;
    uint256 private mintAllowance;

    address private proxyAddress;
    address private minter;
    address private burner;

    string private minterEnv;

    FiatTokenV2_2 proxyAsV2_2;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        minterEnv = vm.envString("MINTER_ENV");

        // note: can't directly compare strings in solidity, need to use a library
        // that computes hashes
        if (
            !stringsEqual(minterEnv, "PROD") && !stringsEqual(minterEnv, "STG")
        ) {
            revert("MINTER_ENV not supported");
        }

        masterMinterOwnerPrivateKey = vm.envUint(
            "MASTER_MINTER_OWNER_PRIVATE_KEY"
        );

        proxyAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");

        console.log("ENVIRONMENT: '%s'", minterEnv);
        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxyAddress);
        console.log(
            "MASTER_MINTER_OWNER: '%s'",
            vm.addr(masterMinterOwnerPrivateKey)
        );

        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        decimals = proxyAsV2_2.decimals();
    }

    /**
     * @dev For testing only: splitting deploy logic into an internal function to expose for testing
     */
    function _setUpHotMinterAndBurner(string memory _minterEnv) internal {
        minter = vm.envAddress(
            string(abi.encodePacked(_minterEnv, "_MINTER_ADDRESS"))
        );
        burner = vm.envAddress(
            string(abi.encodePacked(_minterEnv, "_BURNER_ADDRESS"))
        );
        mintAllowanceInNormalUnits = vm.envUint(
            string(
                abi.encodePacked(_minterEnv, "_MINT_ALLOWANCE_IN_NORMAL_UNITS")
            )
        );
        console.log("MINTER_ADDRESS: '%s'", minter);
        console.log("BURNER_ADDRESS: '%s'", burner);
        console.log(
            "MINT_ALLOWANCE_IN_NORMAL_UNITS: '%s'",
            vm.toString(mintAllowanceInNormalUnits)
        );

        mintAllowance = mintAllowanceInNormalUnits * 10**decimals;

        console.log(">>>>>>> Configuring Known Minter and Burner <<<<<<<");
        vm.startBroadcast(masterMinterOwnerPrivateKey);

        proxyAsV2_2.configureMinter(minter, mintAllowance);

        proxyAsV2_2.configureMinter(burner, 0);
        vm.stopBroadcast();
    }

    /**
     * @dev For testing only: Helper function that runs the script with a specific env
     */
    function setUpHotMinterAndBurner(string memory _minterEnv) external {
        return _setUpHotMinterAndBurner(_minterEnv);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external {
        return _setUpHotMinterAndBurner(minterEnv);
    }
}
