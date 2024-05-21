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
import {
    FiatTokenCeloV2_2
} from "../../../contracts/v2/celo/FiatTokenCeloV2_2.sol";

contract TestUtils is Test {
    uint256 internal deployerPrivateKey = 1;
    uint256 internal proxyAdminPrivateKey = 2;
    uint256 internal masterMinterOwnerPrivateKey = 3;
    uint256 internal ownerPrivateKey = 4;
    uint256 internal pauserPrivateKey = 5;
    uint256 internal blacklisterPrivateKey = 6;

    address internal deployer = vm.addr(deployerPrivateKey);
    address internal proxyAdmin = vm.addr(proxyAdminPrivateKey);
    address internal masterMinterOwner = vm.addr(masterMinterOwnerPrivateKey);
    address internal owner = vm.addr(ownerPrivateKey);
    address internal pauser = vm.addr(pauserPrivateKey);
    address internal blacklister = vm.addr(blacklisterPrivateKey);

    uint8 internal decimals = 6;
    string internal tokenName = "USDC";
    string internal tokenSymbol = "USDC";
    string internal tokenCurrency = "USD";

    string internal blacklistFileName = "test.blacklist.remote.json";

    address[] internal accountsToBlacklist = [
        0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf,
        0xb6f5ec1A0a9cd1526536D3F0426c429529471F40
    ];

    function setUp() public virtual {
        vm.setEnv("TOKEN_NAME", tokenName);
        vm.setEnv("TOKEN_SYMBOL", tokenSymbol);
        vm.setEnv("TOKEN_CURRENCY", tokenCurrency);
        vm.setEnv("TOKEN_DECIMALS", "6");
        vm.setEnv("DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        vm.setEnv("PROXY_ADMIN_ADDRESS", vm.toString(proxyAdmin));
        vm.setEnv(
            "MASTER_MINTER_OWNER_ADDRESS",
            vm.toString(masterMinterOwner)
        );
        vm.setEnv("OWNER_ADDRESS", vm.toString(owner));
        vm.setEnv("PAUSER_ADDRESS", vm.toString(pauser));
        vm.setEnv("BLACKLISTER_ADDRESS", vm.toString(blacklister));

        // Deploy an instance of proxy contract to configure contract address in env
        vm.prank(deployer);
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
            address(masterMinter),
            pauser,
            blacklister,
            vm.addr(ownerPrivateKey)
        );
        proxyAsV2_2.initializeV2(tokenName);
        proxyAsV2_2.initializeV2_1(owner);
        proxyAsV2_2.initializeV2_2(new address[](0), tokenSymbol);
        vm.setEnv("FIAT_TOKEN_PROXY_ADDRESS", vm.toString(address(proxy)));

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
