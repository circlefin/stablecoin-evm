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
import { AddressUtils } from "./AddressUtils.sol";
import { ScriptUtils } from "../ScriptUtils.sol";
import { Ownable } from "../../../contracts/v1/Ownable.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { MintController } from "../../../contracts/minting/MintController.sol";
import { ICreate2Factory } from "../../../contracts/interface/ICreate2Factory.sol";

/**
 * A utility script to generate transactions that deploy fiat token contracts.
 * The contracts will be deployed from an existing Create2Factory instance, deployed prior to running this script.
 */
contract DeployMasterMinterCreate2 is ScriptUtils, AddressUtils {
    address private masterMinterOwner;
    address private fiatTokenAddress;

    uint256 private chainId;
    string private tokenSymbol;

    address private deployer;
    address private factory;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        factory = vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS");

        chainId = vm.envUint("CHAIN_ID");
        tokenSymbol = vm.envString("TOKEN_SYMBOL");

        fiatTokenAddress = vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS");
        masterMinterOwner = vm.envAddress("MASTER_MINTER_OWNER_ADDRESS");

        console.log("CREATE2_FACTORY_CONTRACT_ADDRESS: '%s'", factory);
        console.log("DEPLOYER_ADDRESS: '%s'", deployer);
        console.log("CHAIN_ID: '%s'", chainId);
        console.log("TOKEN_SYMBOL: '%s'", tokenSymbol);
        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", fiatTokenAddress);
        console.log("MASTER_MINTER_OWNER_ADDRESS: '%s'", masterMinterOwner);
    }

    /**
     * @dev For testing only: splitting deploy logic into an internal function to expose for testing
     */
    function _deploy() internal returns (MasterMinter) {
        MasterMinter masterMinter = _deployMasterMinter(deployer);

        return (masterMinter);
    }

    /**
     * @notice Deploy new MasterMinter contract
     *
     * @dev This function uses `deployAndMultiCall` to deploy the MasterMinter contract
     * and then calls `transferOwnership` to set the owner to `masterMinterOwner` in a single transaction.
     *
     * @param deployer The address that will send the master minter deployment transaction
     */
    function _deployMasterMinter(
        address deployer
    ) internal returns (MasterMinter) {
        bytes memory setMinterManager = abi.encodeWithSelector(
            MintController.setMinterManager.selector,
            fiatTokenAddress
        );
        bytes memory rotateOwner = abi.encodeWithSelector(
            Ownable.transferOwnership.selector,
            masterMinterOwner
        );

        bytes[] memory multiCallData = new bytes[](2);
        multiCallData[0] = setMinterManager;
        multiCallData[1] = rotateOwner;

        // Start recording transactions
        vm.startBroadcast(deployer);

        // Deploy and multicall proxy
        address payable masterMinterAddress = payable(
            ICreate2Factory(factory).deployAndMultiCall(
                0,
                masterMinterSalt(chainId, tokenSymbol),
                masterMinterCreationCode(factory),
                multiCallData
            )
        );

        // Stop recording transactions
        vm.stopBroadcast();
        return MasterMinter(masterMinterAddress);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external returns (MasterMinter) {
        return _deploy();
    }
}
