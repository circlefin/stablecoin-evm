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

import { TestUtils } from "./TestUtils.sol";
import {
    ColdStorageTransfer
} from "../../../scripts/deploy/cold-storage-transfer.s.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";

// solhint-disable func-name-mixedcase

contract ColdStorageTransferTest is TestUtils {
    address internal masterMinterContractAddress;
    address payable proxyAddress;

    FiatTokenV2_2 proxyAsV2_2;
    MasterMinter masterMinter;
    FiatTokenProxy proxyAsProxy;

    function setUp() public override {
        TestUtils.setUp();

        proxyAddress = payable(vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS"));
        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        masterMinter = MasterMinter(masterMinterContractAddress);
        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        proxyAsProxy = FiatTokenProxy(proxyAddress);
    }

    function test_ColdStorageTransferNegativeTest() public {
        // all roles assigned to hot key addrs without running the cold storage script
        assertEq(proxyAsV2_2.blacklister(), blacklister);
        assertEq(proxyAsV2_2.owner(), owner);
        assertEq(proxyAsProxy.admin(), proxyAdmin);
        assertEq(proxyAsV2_2.masterMinter(), masterMinterOwner);
        assertEq(masterMinter.owner(), masterMinterOwner);
        assertEq(proxyAsV2_2.pauser(), pauser);
    }

    function test_ColdStorageTransferPositiveTest() public {
        ColdStorageTransfer coldStorageScript = new ColdStorageTransfer();
        coldStorageScript.setUp();
        coldStorageScript.run();

        // all roles assigned to cold key addrs after running the cold storage script
        assertEq(proxyAsV2_2.blacklister(), coldBlacklister);
        assertEq(proxyAsV2_2.owner(), coldOwner);
        assertEq(proxyAsProxy.admin(), coldProxyAdmin);
        assertEq(proxyAsV2_2.masterMinter(), address(masterMinter));
        assertEq(masterMinter.owner(), coldMasterMinterOwner);
        assertEq(proxyAsV2_2.pauser(), coldPauser);
    }
}
