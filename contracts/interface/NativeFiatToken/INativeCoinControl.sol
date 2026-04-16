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

pragma solidity 0.8.24;

/**
 * @title INativeCoinControl
 * @dev Interface for controlling the native coin blocklist.
 * This provides methods for managing restricted addresses and pausing operations.
 */
interface INativeCoinControl {
    /**
     * @notice Adds an address to the blocklist
     * @param account The address to blocklist
     * @return True if the operation was successful
     */
    function blocklist(address account) external returns (bool);

    /**
     * @notice Removes an address from the blocklist
     * @param account The address to unBlocklist
     * @return True if the operation was successful
     */
    function unBlocklist(address account) external returns (bool);

    /**
     * @notice Checks if an address is blocklisted
     * @param account The address to check
     * @return True if the address is blocklisted, false otherwise
     */
    function isBlocklisted(address account) external view returns (bool);
}
