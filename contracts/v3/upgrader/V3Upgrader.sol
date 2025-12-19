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

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { FiatTokenV3 } from "../FiatTokenV3.sol";
import { FiatTokenProxy } from "../../v1/FiatTokenProxy.sol";
import { V3UpgraderHelper } from "./helpers/V3UpgraderHelper.sol";
import { AbstractV3Upgrader } from "../AbstractV3Upgrader.sol";

/**
 * @title V3 Upgrader
 * @notice Performs FiatToken v3 upgrade, and runs a basic sanity test in a single
 * atomic transaction, rolling back if any issues are found. By performing the
 * upgrade atomically, it ensures that there is no disruption of service if the
 * upgrade is not successful for some unforeseen circumstances.
 * @dev Read doc/v3_upgrade.md
 */
contract V3Upgrader is AbstractV3Upgrader {
    using SafeMath for uint256;

    struct FiatTokenMetadata {
        string name;
        string symbol;
        uint8 decimals;
        string currency;
        string version;
        bytes32 domainSeparator;
        address masterMinter;
        address owner;
        address pauser;
        address blacklister;
        address rescuer;
        bool paused;
        uint256 totalSupply;
    }

    address[] private _accountsToBlacklist;
    string private _newSymbol;

    /**
     * @notice Constructor
     * @param proxy               FiatTokenProxy contract
     * @param implementation      FiatTokenV3 implementation contract
     * @param newProxyAdmin       Grantee of proxy admin role after upgrade
     * @param accountsToBlacklist Accounts to add to the new blacklist data structure
     * @param newSymbol           New token symbol
     */
    constructor(
        FiatTokenProxy proxy,
        FiatTokenV3 implementation,
        address newProxyAdmin,
        address[] memory accountsToBlacklist,
        string memory newSymbol
    ) public AbstractV3Upgrader(proxy, address(implementation), newProxyAdmin) {
        _helper = new V3UpgraderHelper(address(proxy));
        _accountsToBlacklist = accountsToBlacklist;
        _newSymbol = newSymbol;
    }

    /**
     * @notice The list of blacklisted accounts to migrate to the blacklist data structure.
     * @return Address[] the list of accounts to blacklist.
     */
    function accountsToBlacklist() external view returns (address[] memory) {
        return _accountsToBlacklist;
    }

    /**
     * @notice The new token symbol
     * @return New symbol
     */
    function newSymbol() external view returns (string memory) {
        return _newSymbol;
    }

    /**
     * @notice Upgrade, transfer proxy admin role to a given address, run a
     * sanity test, and tear down the upgrader contract, in a single atomic
     * transaction. It rolls back if there is an error.
     */
    function upgrade() external onlyOwner {
        // The helper needs to be used to read contract state because
        // AdminUpgradeabilityProxy does not allow the proxy admin to make
        // proxy calls.
        V3UpgraderHelper v3Helper = V3UpgraderHelper(address(_helper));

        // Check that this contract sufficient funds to run the tests
        uint256 contractBal = v3Helper.balanceOf(address(this));
        require(contractBal >= 2e5, "V3Upgrader: 0.2 FiatToken needed");

        uint256 callerBal = v3Helper.balanceOf(msg.sender);

        // Keep original contract metadata
        FiatTokenMetadata memory originalMetadata = FiatTokenMetadata(
            v3Helper.name(),
            v3Helper.symbol(),
            v3Helper.decimals(),
            v3Helper.currency(),
            v3Helper.version(),
            v3Helper.DOMAIN_SEPARATOR(),
            v3Helper.masterMinter(),
            v3Helper.fiatTokenOwner(),
            v3Helper.pauser(),
            v3Helper.blacklister(),
            v3Helper.rescuer(),
            v3Helper.paused(),
            v3Helper.totalSupply()
        );

        // Change implementation contract address
        _proxy.upgradeTo(_implementation);

        // Transfer proxy admin role
        _proxy.changeAdmin(_newProxyAdmin);

        // Initialize V3 contract
        FiatTokenV3 v3 = FiatTokenV3(address(_proxy));
        v3.initializeV3(_accountsToBlacklist, _newSymbol);

        // Sanity test
        // Check metadata
        FiatTokenMetadata memory upgradedMetadata = FiatTokenMetadata(
            v3.name(),
            v3.symbol(),
            v3.decimals(),
            v3.currency(),
            v3.version(),
            v3.DOMAIN_SEPARATOR(),
            v3.masterMinter(),
            v3.owner(),
            v3.pauser(),
            v3.blacklister(),
            v3.rescuer(),
            v3.paused(),
            v3.totalSupply()
        );

        // Verify metadata preserved (except symbol which should be updated)
        require(
            keccak256(bytes(originalMetadata.name)) ==
                keccak256(bytes(upgradedMetadata.name)),
            "V3Upgrader: name mismatch"
        );
        require(
            originalMetadata.decimals == upgradedMetadata.decimals,
            "V3Upgrader: decimals mismatch"
        );
        require(
            keccak256(bytes(originalMetadata.currency)) ==
                keccak256(bytes(upgradedMetadata.currency)),
            "V3Upgrader: currency mismatch"
        );
        // Version changes from "2" to "3" in V3 upgrade
        // require(
        //     keccak256(bytes(originalMetadata.version)) ==
        //         keccak256(bytes(upgradedMetadata.version)),
        //     "V3Upgrader: version mismatch"
        // );
        // Domain separator changes due to version change from "2" to "3"
        // require(
        //     originalMetadata.domainSeparator ==
        //         upgradedMetadata.domainSeparator,
        //     "V3Upgrader: domainSeparator mismatch"
        // );
        require(
            originalMetadata.masterMinter == upgradedMetadata.masterMinter,
            "V3Upgrader: masterMinter mismatch"
        );
        require(
            originalMetadata.owner == upgradedMetadata.owner,
            "V3Upgrader: owner mismatch"
        );
        require(
            originalMetadata.pauser == upgradedMetadata.pauser,
            "V3Upgrader: pauser mismatch"
        );
        require(
            originalMetadata.blacklister == upgradedMetadata.blacklister,
            "V3Upgrader: blacklister mismatch"
        );
        require(
            originalMetadata.rescuer == upgradedMetadata.rescuer,
            "V3Upgrader: rescuer mismatch"
        );
        require(
            originalMetadata.paused == upgradedMetadata.paused,
            "V3Upgrader: paused mismatch"
        );
        require(
            originalMetadata.totalSupply == upgradedMetadata.totalSupply,
            "V3Upgrader: totalSupply mismatch"
        );

        // Check symbol is updated
        require(
            keccak256(bytes(v3.symbol())) == keccak256(bytes(_newSymbol)),
            "V3Upgrader: symbol not updated"
        );

        // Test balanceOf
        require(
            v3.balanceOf(address(this)) == contractBal,
            "V3Upgrader: balanceOf test failed"
        );

        // Test transfer
        require(
            v3.transfer(msg.sender, 1e5) &&
                v3.balanceOf(msg.sender) == callerBal.add(1e5) &&
                v3.balanceOf(address(this)) == contractBal.sub(1e5),
            "V3Upgrader: transfer test failed"
        );

        // Test approve/transferFrom
        require(
            v3.approve(address(v3Helper), 1e5) &&
                v3.allowance(address(this), address(v3Helper)) == 1e5 &&
                v3Helper.transferFrom(address(this), msg.sender, 1e5) &&
                v3.allowance(address(this), msg.sender) == 0 &&
                v3.balanceOf(msg.sender) == callerBal.add(2e5) &&
                v3.balanceOf(address(this)) == contractBal.sub(2e5),
            "V3Upgrader: approve/transferFrom test failed"
        );

        // Transfer any remaining FiatToken to the caller
        withdrawFiatToken();

        // Tear down
        tearDown();
    }
}
