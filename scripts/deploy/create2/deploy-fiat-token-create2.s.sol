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
import { Controller } from "../../../contracts/minting/Controller.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { Ownable } from "../../../contracts/v1/Ownable.sol";
import { Blacklistable } from "../../../contracts/v1/Blacklistable.sol";
import { FiatTokenV1 } from "../../../contracts/v1/FiatTokenV1.sol";
import { FiatTokenV2 } from "../../../contracts/v2/FiatTokenV2.sol";
import { FiatTokenV2_1 } from "../../../contracts/v2/FiatTokenV2_1.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import { AdminUpgradeabilityProxy } from "../../../contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { MintController } from "../../../contracts/minting/MintController.sol";
import { ICreate2Factory } from "../../../contracts/interface/ICreate2Factory.sol";

/**
 * A utility script to generate transactions that deploy fiat token contracts.
 * The contracts will be deployed from an existing Create2Factory instance, deployed prior to running this script.
 *
 * @dev The SignatureChecker library contract deployment transaction must be independently generated.
 * The computed address of the SignatureChecker needs to be linked via a command line flag:
 * https://book.getfoundry.sh/reference/forge/forge-inspect?highlight=link%20library#linker-options
 */
contract DeployFiatTokenCreate2 is ScriptUtils, AddressUtils {
    address private immutable THROWAWAY_ADDRESS = address(1);

    address private impl;
    address private masterMinterOwner;
    address private proxyAdmin;
    address private owner;
    address private pauser;
    address private blacklister;

    uint256 private chainId;
    string private tokenName;
    string private tokenSymbol;
    string private tokenCurrency;
    uint8 private tokenDecimals;

    string private blacklistFileName;
    address[] private addressesToBlacklist;

    address[] private minterControllers;
    address[] private minters;
    uint256[] private minterAllowances;
    address private deployer;
    address private factory;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        factory = vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS");

        chainId = vm.envUint("CHAIN_ID");
        tokenName = vm.envString("TOKEN_NAME");
        tokenSymbol = vm.envString("TOKEN_SYMBOL");
        tokenCurrency = vm.envString("TOKEN_CURRENCY");
        tokenDecimals = uint8(vm.envUint("TOKEN_DECIMALS"));

        impl = vm.envOr("FIAT_TOKEN_IMPLEMENTATION_ADDRESS", address(0));
        proxyAdmin = vm.envAddress("PROXY_ADMIN_ADDRESS");
        masterMinterOwner = vm.envAddress("MASTER_MINTER_OWNER_ADDRESS");
        owner = vm.envAddress("OWNER_ADDRESS");

        // Pauser and blacklister addresses can default to owner address
        pauser = vm.envOr("PAUSER_ADDRESS", owner);
        blacklister = vm.envOr("BLACKLISTER_ADDRESS", owner);

        blacklistFileName = vm.envString("BLACKLIST_FILE_NAME");
        addressesToBlacklist = _loadAccountsToBlacklist(blacklistFileName);
        console.log(
            "# of items in %s:",
            blacklistFileName,
            vm.toString(addressesToBlacklist.length)
        );

        (
            minterControllers,
            minters,
            minterAllowances
        ) = _loadMinterConfiguration(vm.envString("MINTERS_FILE_NAME"));
        console.log(
            "# of items in %s:",
            "minterControllers, minters and minterAllowances",
            vm.toString(minterControllers.length)
        );

        console.log("CREATE2_FACTORY_CONTRACT_ADDRESS: '%s'", factory);
        console.log("DEPLOYER_ADDRESS: '%s'", deployer);
        console.log("CHAIN_ID: '%s'", chainId);
        console.log("TOKEN_NAME: '%s'", tokenName);
        console.log("TOKEN_SYMBOL: '%s'", tokenSymbol);
        console.log("TOKEN_CURRENCY: '%s'", tokenCurrency);
        console.log("TOKEN_DECIMALS: '%s'", tokenDecimals);
        console.log("FIAT_TOKEN_IMPLEMENTATION_ADDRESS: '%s'", impl);
        console.log("PROXY_ADMIN_ADDRESS: '%s'", proxyAdmin);
        console.log("MASTER_MINTER_OWNER_ADDRESS: '%s'", masterMinterOwner);
        console.log("OWNER_ADDRESS: '%s'", owner);
        console.log("PAUSER_ADDRESS: '%s'", pauser);
        console.log("BLACKLISTER_ADDRESS: '%s'", blacklister);
    }

    /**
     * @dev For testing only: splitting deploy logic into an internal function to expose for testing
     */
    function _deploy(
        address _impl
    ) internal returns (FiatTokenV2_2, MasterMinter, FiatTokenProxy) {
        FiatTokenV2_2 implementation;
        if (_impl == address(0)) {
            implementation = _deployAndInitializeImpl(deployer);
        } else {
            implementation = FiatTokenV2_2(_impl);
        }

        FiatTokenProxy proxy = _deployAndInitializeProxy(
            address(implementation),
            deployer
        );

        MasterMinter masterMinter = _deployMasterMinter(
            address(proxy),
            deployer
        );

        return (implementation, masterMinter, proxy);
    }

    /**
     * @dev For testing only: Helper function that runs deploy script with a specific implementation address
     */
    function deploy(
        address _impl
    ) external returns (FiatTokenV2_2, MasterMinter, FiatTokenProxy) {
        return _deploy(_impl);
    }

    /**
     * @notice Deploy new FiatTokenV2_2 contract
     *
     * @dev This function multicalls the implementation contract, to set all metadata values to dummy values.
     * This is done to ensure that the implementation contract is initialized and cannot be initialized again by other parties.
     *
     * @param deployer The address that will send the FiatTokenV2_2 deployment transaction
     */
    function _deployAndInitializeImpl(
        address deployer
    ) internal returns (FiatTokenV2_2) {
        // For V2_2, use the new unified initialize function
        FiatTokenV2_2.InitializeData memory initData = FiatTokenV2_2
            .InitializeData({
                tokenName: "",
                tokenSymbol: "",
                tokenCurrency: "",
                tokenDecimals: 0,
                newMasterMinter: THROWAWAY_ADDRESS,
                newPauser: THROWAWAY_ADDRESS,
                newBlacklister: THROWAWAY_ADDRESS,
                newOwner: THROWAWAY_ADDRESS,
                accountsToBlacklist: new address[](0)
            });

        bytes memory initializer = abi.encodeWithSelector(
            FiatTokenV2_2.initialize.selector,
            initData
        );

        bytes[] memory multiCallData = new bytes[](1);
        multiCallData[0] = initializer;

        // Start recording transactions
        vm.startBroadcast(deployer);

        // Deploy and multicall proxy
        address payable implAddress = payable(
            ICreate2Factory(factory).deployAndMultiCall(
                0,
                implSalt(chainId),
                implCreationCode(),
                multiCallData
            )
        );

        // Stop recording transactions
        vm.stopBroadcast();
        return FiatTokenV2_2(implAddress);
    }

    /**
     * @notice Deploy new FiatTokenProxy contract, and initialize with all metadata fields and a blacklist
     *
     * @dev This function multicalls the proxy contract with the following transactions:
     * 1. Upgrade to the provided implementation address
     * 2. Rotate admin to the proxy admin, set in the environment
     * 3. Initialize the proxy with metadata fields, where master minter is set to the precomputed master minter contract address
     * 4. Initialize the proxy with metadata fields for v2.2
     * 5. Rotate the blacklister to the provided blacklister address, set in the environment
     * 6. Rotate the owner to the provided owner address, set in the environment
     *
     * @param _impl The implementation address to upgrade to
     * @param deployer The address that will send the proxy deployment transaction
     */
    function _deployAndInitializeProxy(
        address _impl,
        address deployer
    ) internal returns (FiatTokenProxy) {
        // For V2_2, use the new unified initialize function
        FiatTokenV2_2.InitializeData memory initData = FiatTokenV2_2
            .InitializeData({
                tokenName: tokenName,
                tokenSymbol: tokenSymbol,
                tokenCurrency: tokenCurrency,
                tokenDecimals: tokenDecimals,
                newMasterMinter: computeMasterMinterAddress(
                    chainId,
                    factory,
                    tokenSymbol
                ),
                newPauser: pauser,
                newBlacklister: factory,
                newOwner: factory,
                accountsToBlacklist: addressesToBlacklist
            });

        bytes memory initializer = abi.encodeWithSelector(
            FiatTokenV2_2.initialize.selector,
            initData
        );

        // Construct upgrade data
        bytes memory upgrade = abi.encodeWithSelector(
            AdminUpgradeabilityProxy.upgradeTo.selector,
            _impl
        );

        // Construct admin rotation data
        bytes memory adminRotationData = abi.encodeWithSelector(
            AdminUpgradeabilityProxy.changeAdmin.selector,
            proxyAdmin
        );

        bytes memory blacklisterRotationData = abi.encodeWithSelector(
            Blacklistable.updateBlacklister.selector,
            blacklister
        );

        bytes memory ownerRotationData = abi.encodeWithSelector(
            Ownable.transferOwnership.selector,
            owner
        );

        // V2_2: Only need 6 calls total (upgrade, changeAdmin, initialize, initializeNext, updateBlacklister, transferOwnership)
        // Blacklisting is now handled in the initialize function via accountsToBlacklist parameter
        bytes[] memory multiCallData = new bytes[](5);
        multiCallData[0] = upgrade;
        multiCallData[1] = adminRotationData;
        multiCallData[2] = initializer;
        multiCallData[3] = blacklisterRotationData;
        multiCallData[4] = ownerRotationData;

        // Start recording transactions
        vm.startBroadcast(deployer);

        // Deploy and multicall proxy
        address payable proxyAddress = payable(
            ICreate2Factory(factory).deployAndMultiCall(
                0,
                proxySalt(chainId, tokenSymbol),
                proxyCreationCode(factory),
                multiCallData
            )
        );

        // Stop recording transactions
        vm.stopBroadcast();

        return FiatTokenProxy(proxyAddress);
    }

    /**
     * @notice Deploy new MasterMinter contract
     *
     * @dev This function multicalls the MasterMinter contract with the following transactions:
     * 1. Set the minter manager to the provided implementation address.
     * 2. For each minter, configure the minter controller to be the factory address, set the minter allowance, then configure the provided minter controller for the minter.
     * 3. Remove the factory address as a controller if minters are configured.
     * 4. Rotate owner to the provided master minter owner address.
     *
     * @param proxyAddress The implementation address to upgrade to
     * @param deployer The address that will send the master minter deployment transaction
     */
    function _deployMasterMinter(
        address proxyAddress,
        address deployer
    ) internal returns (MasterMinter) {
        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        uint256 decimals = proxyAsV2_2.decimals();

        bytes memory setMinterManager = abi.encodeWithSelector(
            MintController.setMinterManager.selector,
            proxyAddress
        );
        bytes memory removeController = abi.encodeWithSelector(
            Controller.removeController.selector,
            factory
        );
        bytes memory rotateOwner = abi.encodeWithSelector(
            Ownable.transferOwnership.selector,
            masterMinterOwner
        );

        uint256 n = 1 /* number of function calls prior to configuring minters */ +
                minters.length *
                3 /* number of function calls for each minter */ +
                (
                    (minters.length > 0) ? 2 : 1
                ); /* number of function calls after configuring minters (extra call to remove controller if minters are configured) */
        bytes[] memory multiCallData = new bytes[](n);
        multiCallData[0] = setMinterManager;

        for (uint256 i = 0; i < minters.length; i++) {
            bytes memory configureControllerWithFactory = abi
                .encodeWithSelector(
                    Controller.configureController.selector,
                    factory,
                    minters[i]
                );
            bytes memory configureMinter = abi.encodeWithSelector(
                MintController.configureMinter.selector,
                minterAllowances[i] * 10 ** decimals
            );
            bytes memory configureController = abi.encodeWithSelector(
                Controller.configureController.selector,
                minterControllers[i],
                minters[i]
            );
            uint256 callDataIndex = 1 + i * 3; // Each minter has 3 operations: configureControllerWithFactory, configureMinter, configureController.
            multiCallData[callDataIndex] = configureControllerWithFactory;
            multiCallData[callDataIndex + 1] = configureMinter;
            multiCallData[callDataIndex + 2] = configureController;
        }

        if (minters.length > 0) {
            multiCallData[n - 2] = removeController;
        }
        multiCallData[n - 1] = rotateOwner;

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
    function run()
        external
        returns (FiatTokenV2_2, MasterMinter, FiatTokenProxy)
    {
        return _deploy(impl);
    }
}
