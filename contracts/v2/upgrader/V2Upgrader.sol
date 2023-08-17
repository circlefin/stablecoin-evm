/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2020 CENTRE SECZ
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

pragma solidity 0.6.12;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { FiatTokenV2 } from "../FiatTokenV2.sol";
import { FiatTokenProxy } from "../../v1/FiatTokenProxy.sol";
import { V2UpgraderHelper } from "./helpers/V2UpgraderHelper.sol";
import { AbstractV2Upgrader } from "./AbstractV2Upgrader.sol";

/**
 * @title V2 Upgrader
 * @notice Performs FiatToken v2 upgrade, and runs a basic sanity test in a single
 * atomic transaction, rolling back if any issues are found. By performing the
 * upgrade atomically, it ensures that there is no disruption of service if the
 * upgrade is not successful for some unforeseen circumstances.
 * @dev Read doc/v2_upgrade.md
 */
contract V2Upgrader is AbstractV2Upgrader {
    using SafeMath for uint256;

    string private _newName;

    /**
     * @notice Constructor
     * @param proxy             FiatTokenProxy contract
     * @param implementation    FiatTokenV2 implementation contract
     * @param newProxyAdmin     Grantee of proxy admin role after upgrade
     * @param newName           New ERC20 name (e.g. "USD//C" -> "USD Coin")
     */
    constructor(
        FiatTokenProxy proxy,
        FiatTokenV2 implementation,
        address newProxyAdmin,
        string memory newName
    ) public AbstractV2Upgrader(proxy, address(implementation), newProxyAdmin) {
        _newName = newName;
        _helper = new V2UpgraderHelper(address(proxy));
    }

    /**
     * @notice New ERC20 token name
     * @return New Name
     */
    function newName() external view returns (string memory) {
        return _newName;
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
        V2UpgraderHelper v2Helper = V2UpgraderHelper(address(_helper));

        // Check that this contract sufficient funds to run the tests
        uint256 contractBal = v2Helper.balanceOf(address(this));
        require(contractBal >= 2e5, "V2Upgrader: 0.2 FiatToken needed");

        uint256 callerBal = v2Helper.balanceOf(msg.sender);

        // Keep original contract metadata
        string memory symbol = v2Helper.symbol();
        uint8 decimals = v2Helper.decimals();
        string memory currency = v2Helper.currency();
        address masterMinter = v2Helper.masterMinter();
        address owner = v2Helper.fiatTokenOwner();
        address pauser = v2Helper.pauser();
        address blacklister = v2Helper.blacklister();

        // Change implementation contract address
        _proxy.upgradeTo(_implementation);

        // Transfer proxy admin role
        _proxy.changeAdmin(_newProxyAdmin);

        // Initialize V2 contract
        FiatTokenV2 v2 = FiatTokenV2(address(_proxy));
        v2.initializeV2(_newName);

        // Sanity test
        // Check metadata
        require(
            keccak256(bytes(_newName)) == keccak256(bytes(v2.name())) &&
                keccak256(bytes(symbol)) == keccak256(bytes(v2.symbol())) &&
                decimals == v2.decimals() &&
                keccak256(bytes(currency)) == keccak256(bytes(v2.currency())) &&
                masterMinter == v2.masterMinter() &&
                owner == v2.owner() &&
                pauser == v2.pauser() &&
                blacklister == v2.blacklister(),
            "V2Upgrader: metadata test failed"
        );

        // Test balanceOf
        require(
            v2.balanceOf(address(this)) == contractBal,
            "V2Upgrader: balanceOf test failed"
        );

        // Test transfer
        require(
            v2.transfer(msg.sender, 1e5) &&
                v2.balanceOf(msg.sender) == callerBal.add(1e5) &&
                v2.balanceOf(address(this)) == contractBal.sub(1e5),
            "V2Upgrader: transfer test failed"
        );

        // Test approve/transferFrom
        require(
            v2.approve(address(v2Helper), 1e5) &&
                v2.allowance(address(this), address(v2Helper)) == 1e5 &&
                v2Helper.transferFrom(address(this), msg.sender, 1e5) &&
                v2.allowance(address(this), msg.sender) == 0 &&
                v2.balanceOf(msg.sender) == callerBal.add(2e5) &&
                v2.balanceOf(address(this)) == contractBal.sub(2e5),
            "V2Upgrader: approve/transferFrom test failed"
        );

        // Transfer any remaining FiatToken to the caller
        withdrawFiatToken();

        // Tear down
        tearDown();
    }
}
