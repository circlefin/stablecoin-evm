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
pragma experimental ABIEncoderV2; // needed for compiling older solc versions: https://github.com/foundry-rs/foundry/issues/4376

import "forge-std/Test.sol"; // solhint-disable no-global-import
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import {
    AbstractV2Upgrader
} from "../../../contracts/v2/upgrader/AbstractV2Upgrader.sol";

contract TestUtils is Test {
    uint256 internal deployerPrivateKey = 1;
    uint256 internal proxyAdminPrivateKey = 2;
    uint256 internal masterMinterOwnerPrivateKey = 3;
    uint256 internal ownerPrivateKey = 4;
    uint256 internal pauserPrivateKey = 5;
    uint256 internal blacklisterPrivateKey = 6;
    uint256 internal prodMinterPrivateKey = 7;
    uint256 internal prodBurnerPrivateKey = 8;
    uint256 internal stgMinterPrivateKey = 9;
    uint256 internal stgBurnerPrivateKey = 10;
    uint256 internal prodMinterControllerIncrementerPrivateKey = 11;
    uint256 internal prodMinterControllerRemoverPrivateKey = 12;
    uint256 internal prodBurnerControllerPrivateKey = 13;
    uint256 internal stgMinterControllerIncrementerPrivateKey = 14;
    uint256 internal stgMinterControllerRemoverPrivateKey = 15;
    uint256 internal stgBurnerControllerPrivateKey = 16;
    uint256 internal coldMasterMinterOwnerPrivateKey = 17;
    uint256 internal coldProxyAdminPrivateKey = 18;
    uint256 internal coldOwnerPrivateKey = 19;
    uint256 internal coldBlacklisterPrivateKey = 20;
    uint256 internal coldPauserPrivateKey = 21;

    address internal deployer = vm.addr(deployerPrivateKey);
    address internal proxyAdmin = vm.addr(proxyAdminPrivateKey);
    address internal masterMinterOwner = vm.addr(masterMinterOwnerPrivateKey);
    address internal owner = vm.addr(ownerPrivateKey);
    address internal pauser = vm.addr(pauserPrivateKey);
    address internal blacklister = vm.addr(blacklisterPrivateKey);
    address internal prodMinter = vm.addr(prodMinterPrivateKey);
    address internal prodBurner = vm.addr(prodBurnerPrivateKey);
    address internal stgMinter = vm.addr(stgMinterPrivateKey);
    address internal stgBurner = vm.addr(stgBurnerPrivateKey);
    address internal prodMinterControllerIncrementer = vm.addr(
        prodMinterControllerIncrementerPrivateKey
    );
    address internal prodMinterControllerRemover = vm.addr(
        prodMinterControllerRemoverPrivateKey
    );
    address internal prodBurnerController = vm.addr(
        prodBurnerControllerPrivateKey
    );
    address internal stgMinterControllerIncrementer = vm.addr(
        stgMinterControllerIncrementerPrivateKey
    );
    address internal stgMinterControllerRemover = vm.addr(
        stgMinterControllerRemoverPrivateKey
    );
    address internal stgBurnerController = vm.addr(
        stgBurnerControllerPrivateKey
    );
    address internal coldMasterMinterOwner = vm.addr(
        coldMasterMinterOwnerPrivateKey
    );
    address internal coldProxyAdmin = vm.addr(coldProxyAdminPrivateKey);
    address internal coldOwner = vm.addr(coldOwnerPrivateKey);
    address internal coldBlacklister = vm.addr(coldBlacklisterPrivateKey);
    address internal coldPauser = vm.addr(coldPauserPrivateKey);

    uint8 internal decimals = 6;
    string internal tokenName = "USDC";
    string internal tokenSymbol = "USDC";

    uint256 internal prodMintAllowanceUnits = 25000000;
    uint256 internal prodMintAllowance = 25000000000000;
    uint256 internal stgMintAllowanceUnits = 25000;
    uint256 internal stgMintAllowance = 25000000000;

    string internal blacklistFileName = "test.blacklist.remote.json";

    address[] internal accountsToBlacklist = [
        0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf,
        0xb6f5ec1A0a9cd1526536D3F0426c429529471F40
    ];

    function setUp() public virtual {
        vm.setEnv("TOKEN_NAME", tokenName);
        vm.setEnv("TOKEN_SYMBOL", tokenSymbol);
        vm.setEnv("TOKEN_CURRENCY", "USD");
        vm.setEnv("TOKEN_DECIMALS", "6");
        vm.setEnv("DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        vm.setEnv("PROXY_ADMIN_ADDRESS", vm.toString(proxyAdmin));
        vm.setEnv("PROXY_ADMIN_PRIVATE_KEY", vm.toString(proxyAdminPrivateKey));
        vm.setEnv(
            "MASTER_MINTER_OWNER_ADDRESS",
            vm.toString(masterMinterOwner)
        );
        vm.setEnv(
            "MASTER_MINTER_OWNER_PRIVATE_KEY",
            vm.toString(masterMinterOwnerPrivateKey)
        );
        vm.setEnv("MINTER_ENV", "PROD");
        vm.setEnv("OWNER_ADDRESS", vm.toString(owner));
        vm.setEnv("OWNER_PRIVATE_KEY", vm.toString(ownerPrivateKey));
        vm.setEnv("PAUSER_ADDRESS", vm.toString(pauser));
        vm.setEnv("BLACKLISTER_ADDRESS", vm.toString(blacklister));
        vm.setEnv(
            "BLACKLISTER_PRIVATE_KEY",
            vm.toString(blacklisterPrivateKey)
        );
        // hot minter/burner
        vm.setEnv("PROD_MINTER_ADDRESS", vm.toString(prodMinter));
        vm.setEnv("PROD_BURNER_ADDRESS", vm.toString(prodBurner));
        vm.setEnv("STG_MINTER_ADDRESS", vm.toString(stgMinter));
        vm.setEnv("STG_BURNER_ADDRESS", vm.toString(stgBurner));
        // minter/burner controller addresses
        vm.setEnv(
            "PROD_MINTER_CONTROLLER_INCREMENTER_ADDRESS",
            vm.toString(prodMinterControllerIncrementer)
        );
        vm.setEnv(
            "PROD_MINTER_CONTROLLER_REMOVER_ADDRESS",
            vm.toString(prodMinterControllerRemover)
        );
        vm.setEnv(
            "PROD_BURNER_CONTROLLER_ADDRESS",
            vm.toString(prodBurnerController)
        );
        vm.setEnv(
            "STG_MINTER_CONTROLLER_INCREMENTER_ADDRESS",
            vm.toString(stgMinterControllerIncrementer)
        );
        vm.setEnv(
            "STG_MINTER_CONTROLLER_REMOVER_ADDRESS",
            vm.toString(stgMinterControllerRemover)
        );
        vm.setEnv(
            "STG_BURNER_CONTROLLER_ADDRESS",
            vm.toString(stgBurnerController)
        );
        // cold storage addresses
        vm.setEnv(
            "COLD_MASTER_MINTER_OWNER_ADDRESS",
            vm.toString(coldMasterMinterOwner)
        );
        vm.setEnv("COLD_PROXY_ADMIN_ADDRESS", vm.toString(coldProxyAdmin));
        vm.setEnv("COLD_OWNER_ADDRESS", vm.toString(coldOwner));
        vm.setEnv("COLD_BLACKLISTER_ADDRESS", vm.toString(coldBlacklister));
        vm.setEnv("COLD_PAUSER_ADDRESS", vm.toString(coldPauser));

        vm.setEnv(
            "PROD_MINT_ALLOWANCE_IN_NORMAL_UNITS",
            vm.toString(prodMintAllowanceUnits)
        );
        vm.setEnv(
            "STG_MINT_ALLOWANCE_IN_NORMAL_UNITS",
            vm.toString(stgMintAllowanceUnits)
        );

        // Deploy an instance of proxy contract to configure contract address in env
        vm.prank(deployer);
        FiatTokenV2_2 v2_2 = new FiatTokenV2_2();

        vm.prank(proxyAdmin);
        FiatTokenProxy proxy = new FiatTokenProxy(address(v2_2));

        vm.startPrank(deployer);
        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(address(proxy));

        proxyAsV2_2.initialize(
            tokenName,
            tokenSymbol,
            "USD",
            decimals,
            masterMinterOwner,
            pauser,
            blacklister,
            vm.addr(ownerPrivateKey)
        );
        proxyAsV2_2.initializeV2(tokenName);
        proxyAsV2_2.initializeV2_1(owner);
        proxyAsV2_2.initializeV2_2(new address[](0), tokenSymbol);

        MasterMinter masterMinter = new MasterMinter(address(proxy));
        masterMinter.transferOwnership(masterMinterOwner);
        vm.stopPrank();

        vm.setEnv("FIAT_TOKEN_PROXY_ADDRESS", vm.toString(address(proxy)));

        vm.setEnv(
            "MASTER_MINTER_CONTRACT_ADDRESS",
            vm.toString(address(masterMinter))
        );

        vm.setEnv("BLACKLIST_FILE_NAME", blacklistFileName);
    }

    function validateImpl(FiatTokenV2_2 impl) internal {
        assertEq(impl.name(), "");
        assertEq(impl.symbol(), "");
        assertEq(impl.currency(), "");
        assert(impl.decimals() == 0);
        assertEq(impl.owner(), address(1));
        assertEq(impl.masterMinter(), address(1));
        assertEq(impl.pauser(), address(1));
        assertEq(impl.blacklister(), address(1));
    }

    function validateMasterMinter(MasterMinter masterMinter, address _proxy)
        internal
    {
        assertEq(masterMinter.owner(), masterMinterOwner);
        assertEq(address(masterMinter.getMinterManager()), _proxy);
    }
}
