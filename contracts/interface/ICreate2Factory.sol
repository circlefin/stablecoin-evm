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
 * @title ICreate2Factory Interface
 * @notice Interface for Create2Factory contract
 */
interface ICreate2Factory {
    /**
     * @notice Deploys the contract.
     * @param amount Amount of native token to seed the deployment
     * @param salt A unique identifier
     * @param bytecode The contract bytecode to deploy
     * @return addr The deployed address
     */
    function deploy(
        uint256 amount,
        bytes32 salt,
        bytes calldata bytecode
    ) external payable returns (address addr);

    /**
     * @notice Deploys the contract and calls into it.
     * @param amount Amount of native token to seed the deployment
     * @param salt A unique identifier
     * @param bytecode The contract bytecode to deploy
     * @param data The data to call the implementation with
     * @return addr The deployed address
     */
    function deployAndMultiCall(
        uint256 amount,
        bytes32 salt,
        bytes calldata bytecode,
        bytes[] calldata data
    ) external payable returns (address addr);

    /**
     * @notice A helper function for predicting a deterministic address.
     * @param salt The unique identifier
     * @param bytecodeHash The keccak256 hash of the deployment bytecode.
     * @return addr The deterministic address
     */
    function computeAddress(
        bytes32 salt,
        bytes32 bytecodeHash
    ) external view returns (address addr);
}
