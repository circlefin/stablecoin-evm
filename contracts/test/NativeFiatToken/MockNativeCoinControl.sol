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
    INativeCoinControl
} from "../../interface/NativeFiatToken/INativeCoinControl.sol";

/**
 * @title MockNativeCoinControl
 * @dev Mock implementation of INativeCoinBlockList for testing purposes.
 * Simulates the blocklist precompile functionality for testing without a real precompile.
 */
contract MockNativeCoinControl is INativeCoinControl {
    // Blocklist state
    mapping(address => bool) private _blocklisted;

    // Access control - simulates the allowlist
    mapping(address => bool) private _allowedOperators;

    // Error tracking for detailed test validation
    string public lastError;

    // Operation tracking for test validation
    address public lastCaller;
    address public lastAccount;

    // Events to match the Go implementation
    event Blocklisted(address indexed account);
    event UnBlocklisted(address indexed account);

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
     * @notice Adds an address to the blocklist
     * @param account The address to blocklist
     * @return True if the operation was successful
     */
    function blocklist(address account) external override returns (bool) {
        lastCaller = msg.sender;
        lastAccount = account;

        // Check permissions (allowlist simulation)
        if (!_allowedOperators[msg.sender]) {
            lastError = "Not enabled blocklister";
            return false;
        }

        _blocklisted[account] = true;

        // Emit event like the precompile would
        emit Blocklisted(account);

        return true;
    }

    /**
     * @notice Removes an address from the blocklist
     * @param account The address to unBlocklist
     * @return True if the operation was successful
     */
    function unBlocklist(address account) external override returns (bool) {
        lastCaller = msg.sender;
        lastAccount = account;

        // Check permissions (allowlist simulation)
        if (!_allowedOperators[msg.sender]) {
            lastError = "Not enabled unblocklister";
            return false;
        }

        _blocklisted[account] = false;

        // Emit event like the precompile would
        emit UnBlocklisted(account);

        return true;
    }

    /**
     * @notice Checks if an address is blocklisted
     * @param account The address to check
     * @return True if the address is blocklisted, false otherwise
     */
    function isBlocklisted(address account)
        external
        override
        view
        returns (bool)
    {
        return _blocklisted[account];
    }
}
