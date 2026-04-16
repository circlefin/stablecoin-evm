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
 * @title INativeCoinAuthority
 * @dev Interface for interacting with the native coin authority precompile.
 * This interface allows for minting, burning, and transferring native coins
 * within the blockchain environment.
 */
interface INativeCoinAuthority {
    /**
     * @notice Burns a specified amount of native coins from an account.
     * @param from The address from which the coins will be burned.
     * @param amount The amount of native coins to burn.
     * @return success True if the burn operation was successful.
     */
    function burn(address from, uint256 amount) external returns (bool success);

    /**
     * @notice Mints a specified amount of native coins to an account.
     * @param to The address that will receive the minted coins.
     * @param amount The amount of native coins to mint.
     * @return success True if the mint operation was successful.
     */
    function mint(address to, uint256 amount) external returns (bool success);

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
    ) external returns (bool success);

    /**
     * @notice Gets the total supply of native coins in circulation.
     * @return The total amount of native coins currently in circulation.
     */
    function totalSupply() external view returns (uint256);
}
