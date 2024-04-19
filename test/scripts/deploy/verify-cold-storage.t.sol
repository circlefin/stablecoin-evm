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
import {
    SetUpHotMinterAndBurner
} from "../../../scripts/deploy/set-up-hot-minter-and-burner.s.sol";
import {
    VerifyColdStorage
} from "../../../scripts/deploy/verify-cold-storage.s.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";

// solhint-disable func-name-mixedcase

contract VerifyColdStorageTest is TestUtils {
    address internal masterMinterContractAddress;
    address payable proxyAddress;

    ColdStorageTransfer coldStorageScript;
    VerifyColdStorage verifyColdStorageScript;
    SetUpHotMinterAndBurner setUpMinterAndBurnerScript;
    FiatTokenProxy proxy;
    FiatTokenV2_2 proxyAsV2_2;
    MasterMinter masterMinter;

    function setUp() public override {
        TestUtils.setUp();

        proxyAddress = payable(vm.envAddress("FIAT_TOKEN_PROXY_ADDRESS"));
        masterMinterContractAddress = vm.envAddress(
            "MASTER_MINTER_CONTRACT_ADDRESS"
        );
        proxyAsV2_2 = FiatTokenV2_2(proxyAddress);
        proxy = FiatTokenProxy(proxyAddress);
        masterMinter = MasterMinter(masterMinterContractAddress);

        setUpMinterAndBurnerScript = new SetUpHotMinterAndBurner();
        setUpMinterAndBurnerScript.setUp();
        setUpMinterAndBurnerScript.setUpHotMinterAndBurner("STG");
        setUpMinterAndBurnerScript.setUpHotMinterAndBurner("PROD");

        coldStorageScript = new ColdStorageTransfer();
        coldStorageScript.setUp();
        coldStorageScript.run();

        verifyColdStorageScript = new VerifyColdStorage();
        verifyColdStorageScript.setUp();
    }

    function test_VerifyColdStoragePositiveTest() public {
        // the verify script does not modify state, but it should run
        // without error after running the cold storage transfer script
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeOwnerTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.transferOwnership(owner);

        vm.expectRevert(
            "Unexpected FiatToken Owner, should be cold storage owner"
        );
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeProxyAdminTest() public {
        vm.prank(coldProxyAdmin);
        proxy.changeAdmin(proxyAdmin);

        vm.expectRevert(
            "Unexpected Proxy Admin, should be the cold storage proxy admin"
        );
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeMasterMinterTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterOwner);

        vm.expectRevert(
            "Unexpected FiatToken masterMinter, should be the MasterMinter contract"
        );
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeMasterMinterOwnerTest() public {
        vm.prank(coldMasterMinterOwner);
        masterMinter.transferOwnership(masterMinterOwner);

        vm.expectRevert(
            "Unexpected MasterMinter owner, should be cold storage MasterMinter owner"
        );
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeBlacklisterTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.updateBlacklister(blacklister);

        vm.expectRevert(
            "Unexpected FiatToken blacklister, should be the cold storage blacklister"
        );
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativePauserTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.updatePauser(pauser);

        vm.expectRevert(
            "Unexpected FiatToken pauser, should be the cold storage pauser"
        );
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeProdMinterAllowanceTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterOwner);

        vm.prank(masterMinterOwner);
        proxyAsV2_2.configureMinter(prodMinter, 0);

        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterContractAddress);

        vm.expectRevert("Prod minter allowance does not match config");
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeProdBurnerAllowanceTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterOwner);

        vm.prank(masterMinterOwner);
        proxyAsV2_2.configureMinter(prodBurner, 1);

        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterContractAddress);

        vm.expectRevert("Prod burner mint allowance should be 0");
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeStgMinterAllowanceTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterOwner);

        vm.prank(masterMinterOwner);
        proxyAsV2_2.configureMinter(stgMinter, 0);

        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterContractAddress);

        vm.expectRevert("Staging minter allowance does not match config");
        verifyColdStorageScript.run();
    }

    function test_VerifyColdStorageNegativeStgBurnerAllowanceTest() public {
        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterOwner);

        vm.prank(masterMinterOwner);
        proxyAsV2_2.configureMinter(stgBurner, 1);

        vm.prank(coldOwner);
        proxyAsV2_2.updateMasterMinter(masterMinterContractAddress);

        vm.expectRevert("Staging burner mint allowance should be 0");
        verifyColdStorageScript.run();
    }
}
