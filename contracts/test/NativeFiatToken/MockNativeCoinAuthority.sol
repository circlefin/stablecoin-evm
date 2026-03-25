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

import {
    INativeCoinAuthority
} from "../../interface/NativeFiatToken/INativeCoinAuthority.sol";
import {
    INativeCoinControl
} from "../../interface/NativeFiatToken/INativeCoinControl.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title MockNativeCoinAuthority
 * @dev Mock implementation of INativeCoinAuthority for testing purposes.
 * Simulates the Go precompile functionality to enable testing without a real precompile.
 */
contract MockNativeCoinAuthority is INativeCoinAuthority {
    using SafeMath for uint256;

    // Track balances internally for testing
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;

    // Access control - simulates the allowlist from the Go implementation
    mapping(address => bool) private _allowedOperators;

    // The blocklist contract reference
    address public immutable BLOCKLIST_ADDRESS;

    // Error tracking for detailed test validation
    string public lastError;

    // Operation tracking for test validation
    address public lastCaller;
    address public lastFrom;
    address public lastTo;
    uint256 public lastAmount;

    // Events to match the Go implementation
    event NativeCoinMinted(
        address indexed caller,
        address indexed to,
        uint256 amount
    );
    event NativeCoinBurned(
        address indexed caller,
        address indexed from,
        uint256 amount
    );
    event NativeCoinTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    constructor(address blocklistAddress) public {
        BLOCKLIST_ADDRESS = blocklistAddress;
    }

    /**
     * @notice Set allowlist status for an operator
     * @param operator The operator address
     * @param allowed Whether the operator is allowed
     */
    function setAllowedOperator(address operator, bool allowed) external {
        _allowedOperators[operator] = allowed;
    }

    /**
     * @notice Check if an operator is allowed
     * @param operator The operator address to check
     * @return Whether the operator is allowed
     */
    function isAllowedOperator(address operator) external view returns (bool) {
        return _allowedOperators[operator];
    }

    /**
     * @notice Burns a specified amount of native coins from an account.
     * @param from The address from which the coins will be burned.
     * @param amount The amount of native coins to burn.
     * @return success True if the burn operation was successful.
     */
    function burn(address from, uint256 amount)
        external
        override
        returns (bool success)
    {
        // Track operation details
        lastCaller = msg.sender;
        lastFrom = from;
        lastAmount = amount;

        // Check permissions (allowlist simulation)
        if (!_allowedOperators[msg.sender]) {
            lastError = "Not enabled native coin burner";
            return false;
        }

        // Check for zero amount
        if (amount == 0) {
            lastError = "Zero amount invalid";
            return false;
        }

        // Check for sufficient funds or simulate insufficient funds
        if (_balances[from] < amount) {
            lastError = "Insufficient funds";
            return false;
        }

        // Check if source address is blocklisted
        if (
            BLOCKLIST_ADDRESS != address(0) &&
            INativeCoinControl(BLOCKLIST_ADDRESS).isBlocklisted(from)
        ) {
            lastError = "Source address is blocklisted";
            revert(lastError);
        }

        // Perform the burn
        _balances[from] = _balances[from].sub(amount);
        _totalSupply = _totalSupply.sub(amount);

        // Emit event like the precompile would
        emit NativeCoinBurned(msg.sender, from, amount);

        return true;
    }

    /**
     * @notice Mints a specified amount of native coins to an account.
     * @param to The address that will receive the minted coins.
     * @param amount The amount of native coins to mint.
     * @return success True if the mint operation was successful.
     */
    function mint(address to, uint256 amount)
        external
        override
        returns (bool success)
    {
        // Track operation details
        lastCaller = msg.sender;
        lastTo = to;
        lastAmount = amount;

        // Check permissions (allowlist simulation)
        if (!_allowedOperators[msg.sender]) {
            lastError = "Not enabled native coin minter";
            return false;
        }

        // Check for zero amount
        if (amount == 0) {
            lastError = "Zero amount invalid";
            return false;
        }

        // Check if destination address is blocklisted
        if (
            BLOCKLIST_ADDRESS != address(0) &&
            INativeCoinControl(BLOCKLIST_ADDRESS).isBlocklisted(to)
        ) {
            lastError = "Destination address is blocklisted";
            revert(lastError);
        }

        // Perform the mint
        _balances[to] = _balances[to].add(amount);
        _totalSupply = _totalSupply.add(amount);

        // Emit event like the precompile would
        emit NativeCoinMinted(msg.sender, to, amount);

        return true;
    }

    /**
     * @notice Transfers a specified amount of native coins between two accounts.
     * @param from The address from which the coins will be transferred.
     * @param to The address that will receive the coins.
     * @param amount The amount of native coins to transfer.
     * @return success True if the transfer operation was successful.
     */
    function transfer(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool success) {
        // Track operation details
        lastCaller = msg.sender;
        lastFrom = from;
        lastTo = to;
        lastAmount = amount;

        // Check for zero amount
        if (amount == 0) {
            lastError = "Zero amount invalid";
            revert(lastError);
        }

        // Check for sufficient funds or simulate insufficient funds
        if (_balances[from] < amount) {
            lastError = "Insufficient funds";
            revert(lastError);
        }

        // Check if source address is blocklisted
        if (
            BLOCKLIST_ADDRESS != address(0) &&
            INativeCoinControl(BLOCKLIST_ADDRESS).isBlocklisted(from)
        ) {
            lastError = "account is blacklisted";
            revert(lastError);
        }

        // Check if destination address is blocklisted
        if (
            BLOCKLIST_ADDRESS != address(0) &&
            INativeCoinControl(BLOCKLIST_ADDRESS).isBlocklisted(to)
        ) {
            lastError = "account is blacklisted";
            revert(lastError);
        }

        // Perform the transfer
        _balances[from] = _balances[from].sub(amount);
        _balances[to] = _balances[to].add(amount);

        // Emit event like the precompile would
        emit NativeCoinTransferred(from, to, amount);

        return true;
    }

    /**
     * @notice Gets the total supply of native coins in circulation.
     * @return The total amount of native coins currently in circulation.
     */
    function totalSupply() external override view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @notice Gets the balance of native coins for a specific account.
     * @dev This function is not intended to be exposed to the public.
     * @dev It is only used for internal testing purposes.
     * @param account The address of the account to get the balance fo  r.
     * @return The balance of native coins for the specified account.
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
}
