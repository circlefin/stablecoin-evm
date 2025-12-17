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

import { FiatTokenV2_2 } from "../FiatTokenV2_2.sol";
import { FiatTokenProxy } from "../../v1/FiatTokenProxy.sol";
import { MetadataUpdateUpgraderHelper } from "./helpers/MetadataUpdateUpgraderHelper.sol";
import { FiatTokenV2_2MetadataUpdateExtension } from "../FiatTokenV2_2MetadataUpdateExtension.sol";
import { AbstractV2Upgrader } from "./AbstractV2Upgrader.sol";

/**
 * @title MetadataUpdateUpgrader
 * @notice This upgrader is used to update the name, symbol, and currency of a deployed token.
 */
contract MetadataUpdateUpgrader is AbstractV2Upgrader {
    FiatTokenV2_2MetadataUpdateExtension private _tempImplementation;
    string private _newName;
    string private _newSymbol;
    string private _newCurrency;

    /**
     * @notice Constructor
     * @param proxy               FiatTokenProxy contract
     * @param tempImplementation  FiatTokenV2_2 implementation contract
     * @param newProxyAdmin       Grantee of proxy admin role after upgrade
     * @param newName             New token name
     * @param newSymbol           New token symbol
     * @param newCurrency         New token currency
     */
    constructor(
        FiatTokenProxy proxy,
        FiatTokenV2_2MetadataUpdateExtension tempImplementation,
        address newProxyAdmin,
        string memory newName,
        string memory newSymbol,
        string memory newCurrency
    ) public AbstractV2Upgrader(proxy, proxy.implementation(), newProxyAdmin) {
        // Sanity check input parameters are valid
        require(
            address(tempImplementation) != address(0),
            "Temp implementation cannot be zero address"
        );
        require(
            newProxyAdmin != address(0),
            "New proxy admin cannot be zero address"
        );
        require(bytes(newName).length > 0, "Name cannot be empty");
        require(bytes(newSymbol).length > 0, "Symbol cannot be empty");
        require(bytes(newCurrency).length > 0, "Currency cannot be empty");

        _tempImplementation = tempImplementation;
        _newName = newName;
        _newSymbol = newSymbol;
        _newCurrency = newCurrency;

        _helper = new MetadataUpdateUpgraderHelper(address(proxy));
    }

    function tempImplementation() external view returns (address) {
        return address(_tempImplementation);
    }

    function newName() external view returns (string memory) {
        return _newName;
    }

    function newSymbol() external view returns (string memory) {
        return _newSymbol;
    }

    function newCurrency() external view returns (string memory) {
        return _newCurrency;
    }

    /**
     * @notice Upgrade, transfer proxy admin role to a given address.
     */
    function upgrade() external onlyOwner {
        MetadataUpdateUpgraderHelper helper = MetadataUpdateUpgraderHelper(
            address(_helper)
        );

        // Keep original contract metadata
        uint8 decimals = helper.decimals();
        address masterMinter = helper.masterMinter();
        address owner = helper.fiatTokenOwner();
        address pauser = helper.pauser();
        address blacklister = helper.blacklister();
        address rescuer = helper.rescuer();
        uint256 totalSupply = helper.totalSupply();
        string memory version = helper.version();
        bool paused = helper.paused();

        // Change implementation contract address
        _proxy.upgradeTo(address(_tempImplementation));

        // The helper needs to be used to read contract state because
        // AdminUpgradeabilityProxy does not allow the proxy admin to make
        // proxy calls.
        helper.updateMetadata(_newName, _newSymbol, _newCurrency);

        // Change implementation contract address
        _proxy.upgradeTo(address(_implementation));

        // Transfer proxy admin role
        _proxy.changeAdmin(_newProxyAdmin);

        // Sanity check implementation address is set to previous FiatTokenV2_2 contract (without rename functionality)
        require(
            _proxy.implementation() == _implementation,
            "MetadataUpdateUpgrader: implementation address mismatch"
        );

        // Sanity check proxy admin address is set to new proxy admin address
        require(
            _proxy.admin() == _newProxyAdmin,
            "MetadataUpdateUpgrader: proxy admin address mismatch"
        );

        // Sanity check name, symbol, currency are updated to new values
        FiatTokenV2_2 v2_2 = FiatTokenV2_2(address(_proxy));
        require(
            keccak256(bytes(_newName)) == keccak256(bytes(v2_2.name())) &&
                keccak256(bytes(_newSymbol)) ==
                keccak256(bytes(v2_2.symbol())) &&
                keccak256(bytes(_newCurrency)) ==
                keccak256(bytes(v2_2.currency())),
            "MetadataUpdateUpgrader: name, symbol, currency update failed"
        );

        // Sanity check other token values did not change
        require(
            decimals == v2_2.decimals() &&
                masterMinter == v2_2.masterMinter() &&
                owner == v2_2.owner() &&
                pauser == v2_2.pauser() &&
                blacklister == v2_2.blacklister() &&
                rescuer == v2_2.rescuer() &&
                totalSupply == v2_2.totalSupply() &&
                keccak256(bytes(version)) == keccak256(bytes(v2_2.version())) &&
                paused == v2_2.paused(),
            "MetadataUpdateUpgrader: metadata test failed"
        );

        // Tear down
        tearDown();
    }
}
