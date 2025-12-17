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
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import { Test } from "forge-std/Test.sol";
import { FiatTokenV2_2MetadataUpdateExtension } from "../../contracts/v2/FiatTokenV2_2MetadataUpdateExtension.sol";
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";
import { MetadataUpdateUpgrader } from "../../contracts/v2/upgrader/MetadataUpdateUpgrader.sol";
import { UpgradeabilityProxy } from "../../contracts/upgradeability/UpgradeabilityProxy.sol";

// solhint-disable func-name-mixedcase

contract MetadataUpdateUpgraderTest is Test {
    event Upgraded(address newImplementation);

    FiatTokenProxy private proxy;
    FiatTokenV2_2 private proxyAsV2_2;
    FiatTokenV2_2MetadataUpdateExtension private v2_2MetadataExtension;
    MetadataUpdateUpgrader private metadataUpdateUpgrader;

    address private deployer = makeAddr("deployer");
    address private proxyAdmin = makeAddr("proxyAdmin");
    address private masterMinter = makeAddr("masterMinter");
    address private pauser = makeAddr("pauser");
    address private blacklister = makeAddr("blacklister");
    address private fiatTokenOwner = makeAddr("fiatTokenOwner");
    address private upgraderOwner = makeAddr("upgraderOwner");

    string private newName = "New Token Name";
    string private newSymbol = "NTN";
    string private newCurrency = "NEW";

    function setUp() public {
        // Deploy and initialize new fiat token at v2.2
        vm.startPrank(deployer);
        {
            FiatTokenV2_2 v2_2Impl = new FiatTokenV2_2();
            proxy = new FiatTokenProxy(address(v2_2Impl));
            proxyAsV2_2 = FiatTokenV2_2(address(proxy));
            proxy.changeAdmin(proxyAdmin);
        }
        vm.stopPrank();

        // Initialize proxy
        vm.startPrank(fiatTokenOwner);
        {
            proxyAsV2_2.initialize(
                "Bridged USDC",
                "USDC.e",
                "TST",
                6,
                masterMinter,
                pauser,
                blacklister,
                fiatTokenOwner
            );
            proxyAsV2_2.initializeV2("Bridged USDC");
            proxyAsV2_2.initializeV2_1(address(0)); // lost and found address
            proxyAsV2_2.initializeV2_2(new address[](0), "USDC.e");
        }
        vm.stopPrank();

        // Deploy temporary FiatTokenV2_2MetadataUpdateExtension implementation and upgrader
        vm.startPrank(upgraderOwner);
        {
            // Deploy temporary FiatTokenV2_2MetadataUpdateExtension impl
            v2_2MetadataExtension = new FiatTokenV2_2MetadataUpdateExtension();

            // Deploy MetadataUpdateUpgrader
            metadataUpdateUpgrader = new MetadataUpdateUpgrader(
                proxy,
                v2_2MetadataExtension,
                proxyAdmin,
                newName,
                newSymbol,
                newCurrency
            );
        }
        vm.stopPrank();
    }

    function test_readonlyFields_setToCorrectValues() public {
        assertEq(
            metadataUpdateUpgrader.proxy(),
            address(proxy),
            "Proxy not set correctly"
        );
        assertEq(
            metadataUpdateUpgrader.newName(),
            newName,
            "Name not set correctly"
        );
        assertEq(
            metadataUpdateUpgrader.newSymbol(),
            newSymbol,
            "Symbol not set correctly"
        );
        assertEq(
            metadataUpdateUpgrader.newCurrency(),
            newCurrency,
            "Currency not set correctly"
        );
        assertEq(
            metadataUpdateUpgrader.newProxyAdmin(),
            proxyAdmin,
            "Proxy admin not set correctly"
        );
        assertEq(
            metadataUpdateUpgrader.tempImplementation(),
            address(v2_2MetadataExtension),
            "Temp implementation not set correctly"
        );
        assertEq(
            metadataUpdateUpgrader.owner(),
            upgraderOwner,
            "Owner not set correctly"
        );
        assertEq(
            metadataUpdateUpgrader.implementation(),
            proxy.implementation(),
            "Implementation not set correctly"
        );
    }

    function test_constructor_revertIfTempImplementationIsZero() public {
        vm.expectRevert("Temp implementation cannot be zero address");
        new MetadataUpdateUpgrader(
            proxy,
            FiatTokenV2_2MetadataUpdateExtension(address(0)),
            proxyAdmin,
            newName,
            newSymbol,
            newCurrency
        );
    }

    function test_constructor_revertIfProxyAdminIsZero() public {
        vm.expectRevert("New proxy admin cannot be zero address");
        new MetadataUpdateUpgrader(
            proxy,
            v2_2MetadataExtension,
            address(0),
            newName,
            newSymbol,
            newCurrency
        );
    }

    function test_constructor_revertIfNameIsEmpty() public {
        vm.expectRevert("Name cannot be empty");
        new MetadataUpdateUpgrader(
            proxy,
            v2_2MetadataExtension,
            proxyAdmin,
            "",
            newSymbol,
            newCurrency
        );
    }

    function test_constructor_revertIfSymbolIsEmpty() public {
        vm.expectRevert("Symbol cannot be empty");
        new MetadataUpdateUpgrader(
            proxy,
            v2_2MetadataExtension,
            proxyAdmin,
            newName,
            "",
            newCurrency
        );
    }

    function test_constructor_revertIfCurrencyIsEmpty() public {
        vm.expectRevert("Currency cannot be empty");
        new MetadataUpdateUpgrader(
            proxy,
            v2_2MetadataExtension,
            proxyAdmin,
            newName,
            newSymbol,
            ""
        );
    }

    function test_upgrade_updatesMetadataAndRestoresImplementation() public {
        address originalImplementation = proxy.implementation();

        // Transfer proxy admin role to upgrader
        vm.prank(proxyAdmin);
        proxy.changeAdmin(address(metadataUpdateUpgrader));

        // Perform upgrade
        vm.expectEmit(false, false, false, true);
        emit Upgraded(address(v2_2MetadataExtension));
        vm.expectEmit(false, false, false, true);
        emit Upgraded(originalImplementation);
        vm.prank(upgraderOwner);
        metadataUpdateUpgrader.upgrade();

        // Verify metadata was updated
        assertEq(proxyAsV2_2.name(), newName, "Name not updated correctly");
        assertEq(
            proxyAsV2_2.symbol(),
            newSymbol,
            "Symbol not updated correctly"
        );
        assertEq(
            proxyAsV2_2.currency(),
            newCurrency,
            "Currency not updated correctly"
        );

        // Verify implementation was restored
        assertEq(
            proxy.implementation(),
            originalImplementation,
            "Implementation not restored"
        );
        assertEq(proxy.admin(), proxyAdmin, "Proxy admin not restored");

        // Attempt to updateMetadata again - expect failure
        vm.expectRevert();
        FiatTokenV2_2MetadataUpdateExtension(address(proxy)).updateMetadata(
            newName,
            newSymbol,
            newCurrency
        );

        // Verify helper and upgrader contracts bytecode still exists after self-destruct
        // This is due to selfdestruct being deprecated in https://eips.ethereum.org/EIPS/eip-6780
        assertTrue(
            getContractCodeSize(metadataUpdateUpgrader.helper()) > 0,
            "Helper contract not self-destructed"
        );
        assertTrue(
            getContractCodeSize(address(metadataUpdateUpgrader)) > 0,
            "Upgrader contract not self-destructed"
        );
    }

    function test_upgrade_revertsIfNotCalledByOwner() public {
        // Transfer proxy admin role to upgrader
        vm.prank(proxyAdmin);
        proxy.changeAdmin(address(metadataUpdateUpgrader));

        // Try to upgrade from non-owner address
        vm.prank(address(0xdead));
        vm.expectRevert("Ownable: caller is not the owner");
        metadataUpdateUpgrader.upgrade();
    }

    function test_abortUpgrade_succeedsIfCalledByOwner() public {
        // Transfer proxy admin role to upgrader
        vm.prank(proxyAdmin);
        proxy.changeAdmin(address(metadataUpdateUpgrader));

        // Store expected new proxy admin
        address expectedNewProxyAdmin = metadataUpdateUpgrader.newProxyAdmin();

        // Abort upgrade
        vm.prank(upgraderOwner);
        metadataUpdateUpgrader.abortUpgrade();

        // Verify proxy admin role was restored
        assertEq(proxy.admin(), expectedNewProxyAdmin, "Admin not restored");
    }

    function test_abortUpgrade_succeedsIfCalledByNewProxyAdmin() public {
        // Transfer proxy admin role to upgrader
        vm.prank(proxyAdmin);
        proxy.changeAdmin(address(metadataUpdateUpgrader));

        // Store expected new proxy admin
        address expectedNewProxyAdmin = metadataUpdateUpgrader.newProxyAdmin();

        // Abort upgrade
        vm.prank(expectedNewProxyAdmin);
        metadataUpdateUpgrader.abortUpgrade();

        // Verify proxy admin role was restored
        assertEq(proxy.admin(), expectedNewProxyAdmin, "Admin not restored");
    }

    function test_abortUpgrade_revertsIfNotCalledByOwnerOrNewProxyAdmin()
        public
    {
        // Transfer proxy admin role to upgrader
        vm.prank(proxyAdmin);
        proxy.changeAdmin(address(metadataUpdateUpgrader));

        // Try to abort from non-owner address
        vm.prank(address(0xdead));
        vm.expectRevert(
            "AbstractV2Upgrader: caller is not the owner or new proxy admin"
        );
        metadataUpdateUpgrader.abortUpgrade();
    }

    // Helper function to get the code size of a contract
    function getContractCodeSize(
        address addr
    ) internal view returns (uint256 size) {
        assembly {
            size := extcodesize(addr)
        }
    }
}
