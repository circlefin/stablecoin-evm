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

import "forge-std/Test.sol"; // solhint-disable no-global-import
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { Blacklistable } from "../../../contracts/v1/Blacklistable.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import { FiatTokenCeloV2_2 } from "../../../contracts/v2/celo/FiatTokenCeloV2_2.sol";
// solhint-disable max-states-count

contract TestUtils is Test {
    uint256 internal deployerPrivateKey = 1;
    uint256 internal proxyAdminPrivateKey = 2;
    uint256 internal masterMinterOwnerPrivateKey = 3;
    uint256 internal ownerPrivateKey = 4;
    uint256 internal pauserPrivateKey = 5;
    uint256 internal blacklisterPrivateKey = 6;
    uint256 internal minter1PrivateKey = 7;
    uint256 internal burner1PrivateKey = 8;
    uint256 internal minter2PrivateKey = 9;
    uint256 internal burner2PrivateKey = 10;
    uint256 internal minterControllerIncrementer1PrivateKey = 11;
    uint256 internal minterControllerRemover1PrivateKey = 12;
    uint256 internal burnerController1PrivateKey = 13;
    uint256 internal minterControllerIncrementer2PrivateKey = 14;
    uint256 internal minterControllerRemover2PrivateKey = 15;
    uint256 internal burnerController2PrivateKey = 16;
    uint256 internal altMasterMinterOwnerPrivateKey = 17;
    uint256 internal altProxyAdminPrivateKey = 18;
    uint256 internal altOwnerPrivateKey = 19;
    uint256 internal altPauserPrivateKey = 20;

    address internal deployer = vm.addr(deployerPrivateKey);
    address internal proxyAdmin = vm.addr(proxyAdminPrivateKey);
    address internal masterMinterOwner = vm.addr(masterMinterOwnerPrivateKey);
    address internal owner = vm.addr(ownerPrivateKey);
    address internal pauser = vm.addr(pauserPrivateKey);
    address internal blacklister = vm.addr(blacklisterPrivateKey);
    address internal minter1 = vm.addr(minter1PrivateKey);
    address internal burner1 = vm.addr(burner1PrivateKey);
    address internal minter2 = vm.addr(minter2PrivateKey);
    address internal burner2 = vm.addr(burner2PrivateKey);
    address internal minterControllerIncrementer1 =
        vm.addr(minterControllerIncrementer1PrivateKey);
    address internal minterControllerRemover1 =
        vm.addr(minterControllerRemover1PrivateKey);
    address internal burnerController1 = vm.addr(burnerController1PrivateKey);
    address internal minterControllerIncrementer2 =
        vm.addr(minterControllerIncrementer2PrivateKey);
    address internal minterControllerRemover2 =
        vm.addr(minterControllerRemover2PrivateKey);
    address internal burnerController2 = vm.addr(burnerController2PrivateKey);
    address internal altMasterMinterOwner =
        vm.addr(altMasterMinterOwnerPrivateKey);
    address internal altProxyAdmin = vm.addr(altProxyAdminPrivateKey);
    address internal altOwner = vm.addr(altOwnerPrivateKey);
    address internal altPauser = vm.addr(altPauserPrivateKey);

    uint256 internal chainId = 31337;
    uint8 internal decimals = 6;
    string internal tokenName = "USDC";
    string internal tokenSymbol = "USDC";
    string internal tokenCurrency = "USD";

    uint256 internal mintAllowanceUnits1 = 1000000;
    uint256 internal mintAllowance1 = 1000000000000;
    uint256 internal mintAllowanceUnits2 = 1000;
    uint256 internal mintAllowance2 = 1000000000;

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
        vm.setEnv(
            "ALT_MASTER_MINTER_OWNER_ADDRESS",
            vm.toString(altMasterMinterOwner)
        );
        vm.setEnv("ALT_PROXY_ADMIN_ADDRESS", vm.toString(altProxyAdmin));
        vm.setEnv("ALT_OWNER_ADDRESS", vm.toString(altOwner));
        vm.setEnv("ALT_PAUSER_ADDRESS", vm.toString(altPauser));

        // Deploy an instance of proxy contract to configure contract address in env
        FiatTokenV2_2 v2_2 = new FiatTokenV2_2();

        vm.prank(proxyAdmin);
        FiatTokenProxy proxy = new FiatTokenProxy(address(v2_2));

        vm.startPrank(deployer);
        MasterMinter masterMinter = new MasterMinter(address(proxy));
        masterMinter.transferOwnership(masterMinterOwner);

        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(address(proxy));

        proxyAsV2_2.initialize(
            FiatTokenV2_2.InitializeData({
                tokenName: tokenName,
                tokenSymbol: tokenSymbol,
                tokenCurrency: "USD",
                tokenDecimals: decimals,
                newMasterMinter: masterMinterOwner,
                newPauser: pauser,
                newBlacklister: blacklister,
                newOwner: owner,
                accountsToBlacklist: new address[](0)
            })
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
            FiatTokenV2_2.InitializeData({
                tokenName: tokenName,
                tokenSymbol: tokenSymbol,
                tokenCurrency: tokenCurrency,
                tokenDecimals: decimals,
                newMasterMinter: address(masterMinter),
                newPauser: pauser,
                newBlacklister: blacklister,
                newOwner: owner,
                accountsToBlacklist: new address[](0)
            })
        );
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

    function validateMasterMinter(
        MasterMinter masterMinter,
        address _proxy
    ) internal {
        assertEq(masterMinter.owner(), masterMinterOwner);
        assertEq(address(masterMinter.getMinterManager()), _proxy);
    }

    function validateAddressesBlacklistedState(
        address proxy,
        bool blacklisted
    ) internal {
        for (uint256 i = 0; i < accountsToBlacklist.length; i++) {
            assertEq(
                Blacklistable(proxy).isBlacklisted(accountsToBlacklist[i]),
                blacklisted
            );
        }
    }
}
