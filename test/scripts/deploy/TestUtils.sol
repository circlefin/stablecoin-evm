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
pragma experimental ABIEncoderV2; // needed for compiling older solc versions: https://github.com/foundry-rs/foundry/issues/4376

import "forge-std/Test.sol"; // solhint-disable no-global-import
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { Blacklistable } from "../../../contracts/v1/Blacklistable.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import {
    FiatTokenCeloV2_2
} from "../../../contracts/v2/celo/FiatTokenCeloV2_2.sol";
import { Create2Factory } from "../../../contracts/test/Create2Factory.sol";

// solhint-disable max-states-count

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
    uint256 internal coldPauserPrivateKey = 20;

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
    address internal coldPauser = vm.addr(coldPauserPrivateKey);

    uint256 internal chainId = 31337;
    uint8 internal decimals = 6;
    string internal tokenName = "USDC";
    string internal tokenSymbol = "USDC";
    string internal tokenCurrency = "USD";

    uint256 internal prodMintAllowanceUnits = 25000000;
    uint256 internal prodMintAllowance = 25000000000000;
    uint256 internal stgMintAllowanceUnits = 25000;
    uint256 internal stgMintAllowance = 25000000000;

    string internal blacklistFileName = "test.blacklist.remote.json";

    address[] internal accountsToBlacklist = [
        0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf,
        0xb6f5ec1A0a9cd1526536D3F0426c429529471F40
    ];

    address[] internal minterControllers = [
        0x1234567890123456789012345678901234567890,
        0x2345678901234567890123456789012345678901,
        0x3456789012345678901234567890123456789012
    ];

    address[] internal minters = [
        0x4567890123456789012345678901234567890123,
        0x5678901234567890123456789012345678901234,
        0x6789012345678901234567890123456789012345
    ];

    uint256[] internal minterAllowances = [60000000, 70000000, 80000000];

    function setUp() public virtual {
        vm.setEnv("CHAIN_ID", vm.toString(chainId));
        vm.setEnv("TOKEN_NAME", tokenName);
        vm.setEnv("TOKEN_SYMBOL", tokenSymbol);
        vm.setEnv("TOKEN_CURRENCY", tokenCurrency);
        vm.setEnv("TOKEN_DECIMALS", "6");
        vm.setEnv("DEPLOYER_ADDRESS", vm.toString(deployer));
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
        vm.setEnv("OWNER_ADDRESS", vm.toString(owner));
        vm.setEnv("OWNER_PRIVATE_KEY", vm.toString(ownerPrivateKey));
        vm.setEnv("PAUSER_ADDRESS", vm.toString(pauser));
        vm.setEnv("BLACKLISTER_ADDRESS", vm.toString(blacklister));
        vm.setEnv(
            "BLACKLISTER_PRIVATE_KEY",
            vm.toString(blacklisterPrivateKey)
        );
        // cold storage addresses
        vm.setEnv(
            "COLD_MASTER_MINTER_OWNER_ADDRESS",
            vm.toString(coldMasterMinterOwner)
        );
        vm.setEnv("COLD_PROXY_ADMIN_ADDRESS", vm.toString(coldProxyAdmin));
        vm.setEnv("COLD_OWNER_ADDRESS", vm.toString(coldOwner));
        vm.setEnv("COLD_PAUSER_ADDRESS", vm.toString(coldPauser));

        // Deploy an instance of proxy contract to configure contract address in env
        vm.prank(deployer);
        Create2Factory factory = new Create2Factory();

        FiatTokenV2_2 v2_2 = new FiatTokenV2_2();

        vm.prank(proxyAdmin);
        FiatTokenProxy proxy = new FiatTokenProxy(address(v2_2));

        vm.startPrank(deployer);
        MasterMinter masterMinter = new MasterMinter(address(proxy));
        masterMinter.transferOwnership(masterMinterOwner);

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

        vm.setEnv(
            "CREATE2_FACTORY_CONTRACT_ADDRESS",
            vm.toString(address(factory))
        );

        vm.setEnv("FIAT_TOKEN_PROXY_ADDRESS", vm.toString(address(proxy)));

        vm.setEnv(
            "MASTER_MINTER_CONTRACT_ADDRESS",
            vm.toString(address(masterMinter))
        );

        vm.setEnv("BLACKLIST_FILE_NAME", blacklistFileName);

        setUpCelo();
    }

    function setUpCelo() internal {
        // Deploy and initialize FiatTokenCeloV2_2 and it's proxy.
        vm.startPrank(deployer);
        FiatTokenCeloV2_2 celoV2_2 = new FiatTokenCeloV2_2();
        FiatTokenProxy proxy = new FiatTokenProxy(address(celoV2_2));
        FiatTokenCeloV2_2 proxyAsV2_2 = FiatTokenCeloV2_2(address(proxy));
        MasterMinter masterMinter = new MasterMinter(address(proxy));
        masterMinter.transferOwnership(masterMinterOwner);
        proxy.changeAdmin(proxyAdmin);
        // This is required since the FiatTokenFeeAdapter needs the decimals field.
        proxyAsV2_2.initialize(
            tokenName,
            tokenSymbol,
            tokenCurrency,
            decimals,
            address(masterMinter),
            pauser,
            blacklister,
            owner
        );
        proxyAsV2_2.initializeV2(tokenName);
        proxyAsV2_2.initializeV2_1(owner);
        proxyAsV2_2.initializeV2_2(new address[](0), tokenSymbol);
        vm.stopPrank();

        vm.setEnv("FIAT_TOKEN_CELO_PROXY_ADDRESS", vm.toString(address(proxy)));
        vm.setEnv("FEE_ADAPTER_PROXY_ADMIN_ADDRESS", vm.toString(proxyAdmin));
        vm.setEnv("FEE_ADAPTER_DECIMALS", "18");
    }

    function validateProxy(
        FiatTokenProxy proxy,
        address _impl,
        address _masterMinter
    ) internal {
        assertEq(proxy.admin(), proxyAdmin);
        assertEq(proxy.implementation(), _impl);

        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(address(proxy));
        assertEq(proxyAsV2_2.name(), "USDC");
        assertEq(proxyAsV2_2.symbol(), "USDC");
        assertEq(proxyAsV2_2.currency(), "USD");
        assert(proxyAsV2_2.decimals() == 6);
        assertEq(proxyAsV2_2.owner(), owner);
        assertEq(proxyAsV2_2.pauser(), pauser);
        assertEq(proxyAsV2_2.blacklister(), blacklister);
        assertEq(proxyAsV2_2.masterMinter(), _masterMinter);
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

    function validateMasterMinterWhenMintersConfigured(
        MasterMinter masterMinter,
        address _proxy
    ) internal {
        assertEq(masterMinter.owner(), masterMinterOwner);
        assertEq(address(masterMinter.getMinterManager()), _proxy);

        assertEq(masterMinter.getWorker(minterControllers[0]), minters[0]);
        assertEq(masterMinter.getWorker(minterControllers[1]), minters[1]);
        assertEq(masterMinter.getWorker(minterControllers[2]), minters[2]);

        assertEq(
            masterMinter.getWorker(
                vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS")
            ),
            address(0)
        );

        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(_proxy);
        assertEq(proxyAsV2_2.isMinter(minters[0]), true);
        assertEq(proxyAsV2_2.isMinter(minters[1]), true);
        assertEq(proxyAsV2_2.isMinter(minters[2]), true);
        assertEq(proxyAsV2_2.minterAllowance(minters[0]), minterAllowances[0]);
        assertEq(proxyAsV2_2.minterAllowance(minters[1]), minterAllowances[1]);
        assertEq(proxyAsV2_2.minterAllowance(minters[2]), minterAllowances[2]);
    }

    function validateMasterMinterWhenMintersNotConfigured(
        MasterMinter masterMinter,
        address _proxy
    ) internal {
        assertEq(masterMinter.owner(), masterMinterOwner);
        assertEq(address(masterMinter.getMinterManager()), _proxy);

        assertEq(masterMinter.getWorker(minterControllers[0]), address(0));
        assertEq(masterMinter.getWorker(minterControllers[1]), address(0));
        assertEq(masterMinter.getWorker(minterControllers[2]), address(0));

        assertEq(
            masterMinter.getWorker(
                vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS")
            ),
            address(0)
        );

        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(_proxy);
        assertEq(proxyAsV2_2.isMinter(minters[0]), false);
        assertEq(proxyAsV2_2.isMinter(minters[1]), false);
        assertEq(proxyAsV2_2.isMinter(minters[2]), false);
        assertEq(proxyAsV2_2.minterAllowance(minters[0]), 0);
        assertEq(proxyAsV2_2.minterAllowance(minters[1]), 0);
        assertEq(proxyAsV2_2.minterAllowance(minters[2]), 0);
    }

    function validateAddressesBlacklistedState(address proxy, bool blacklisted)
        internal
    {
        for (uint256 i = 0; i < accountsToBlacklist.length; i++) {
            assertEq(
                Blacklistable(proxy).isBlacklisted(accountsToBlacklist[i]),
                blacklisted
            );
        }
    }

    function validateStandaloneMasterMinter(MasterMinter masterMinter)
        internal
    {
        assertEq(masterMinter.owner(), masterMinterOwner);
        assertEq(
            masterMinter.getWorker(
                vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS")
            ),
            address(0)
        );

        // Validate minter manager was set correctly to factory
        assertEq(
            address(masterMinter.getMinterManager()),
            vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS")
        );
    }
}
