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
import { FiatTokenV1 } from "../../../contracts/v1/FiatTokenV1.sol";
import {
    AbstractV2Upgrader
} from "../../../contracts/v2/upgrader/AbstractV2Upgrader.sol";

contract TestUtils is Test {
    uint256 internal deployerPrivateKey = 1;
    string internal tokenName = "USDC";
    string internal tokenSymbol = "USDC";
    address internal proxyAdmin = vm.addr(2);
    address internal masterMinterOwner = vm.addr(3);
    address internal owner = vm.addr(4);
    address internal pauser = vm.addr(5);
    address internal blacklister = vm.addr(6);
    address internal lostAndFound = vm.addr(7);
    address[] internal accountsToBlacklist = new address[](0);

    function setUp() public virtual {
        vm.setEnv("TOKEN_NAME", tokenName);
        vm.setEnv("TOKEN_SYMBOL", tokenSymbol);
        vm.setEnv("TOKEN_CURRENCY", "USD");
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
        vm.setEnv("LOST_AND_FOUND_ADDRESS", vm.toString(lostAndFound));

        // Deploy an instance of proxy contract to configure contract address in env
        FiatTokenV1 v1 = new FiatTokenV1();
        FiatTokenProxy proxy = new FiatTokenProxy(address(v1));
        vm.setEnv("FIAT_TOKEN_PROXY_ADDRESS", vm.toString(address(proxy)));

        // Write accountsToBlacklist to local blacklist.remote.json
        vm.writeJson("[]", "blacklist.remote.json");
    }

    function validateImpl(FiatTokenV1 impl) internal {
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
