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

import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { ScriptUtils } from "../ScriptUtils.sol";
import { SignatureChecker } from "../../../contracts/util/SignatureChecker.sol";

/**
 * @notice A utility contract that defines reuseable contract salt and address computation functions
 */
contract AddressUtils is ScriptUtils {
    /**
     * @dev Salt values for SignatureChecker, FiatTokenProxy, FiatTokenV2_2, and MasterMinter as defined as follows
     */

    function signatureCheckerSalt(
        uint256 chainId
    ) public view returns (bytes32 salt) {
        return keccak256(abi.encodePacked(chainId));
    }

    function proxySalt(
        uint256 chainId,
        string memory tokenSymbol
    ) public view returns (bytes32 salt) {
        return keccak256(abi.encodePacked(chainId, tokenSymbol));
    }

    function implSalt(uint256 chainId) public view returns (bytes32 salt) {
        return keccak256(abi.encodePacked(chainId));
    }

    function masterMinterSalt(
        uint256 chainId,
        string memory tokenSymbol
    ) public view returns (bytes32 salt) {
        return keccak256(abi.encodePacked(chainId, tokenSymbol));
    }

    /**
     * @dev Deterministic creation code for SignatureChecker
     */
    function signatureCheckerCreationCode()
        public
        pure
        returns (bytes memory creationCode)
    {
        return type(SignatureChecker).creationCode;
    }

    /**
     * @dev Deterministic creation code for FiatTokenV2_2
     */
    function implCreationCode()
        public
        pure
        returns (bytes memory creationCode)
    {
        return type(FiatTokenV2_2).creationCode;
    }

    /**
     * @notice Deterministic creation code for FiatTokenProxy, where initial implementation is set to the factory address
     * @param factory The factory address to set in the proxy
     */
    function proxyCreationCode(
        address factory
    ) public pure returns (bytes memory creationCode) {
        return
            abi.encodePacked(
                type(FiatTokenProxy).creationCode,
                abi.encode(factory) // Set to factory initially
            );
    }

    /**
     * @notice Deterministic creation code for MasterMinter, where initial mint manager is set to the factory address
     * @param factory The factory address to set in
     */
    function masterMinterCreationCode(
        address factory
    ) public pure returns (bytes memory creationCode) {
        return
            abi.encodePacked(
                type(MasterMinter).creationCode,
                abi.encode(factory) // Set to factory initially
            );
    }

    /**
     * @notice Precomputes the address of the SignatureChecker contract
     * @param chainId The ID of the chain we're deploying on
     * @param factory The factory address that would deploy SignatureChecker
     */
    function computeSignatureCheckerAddress(
        uint256 chainId,
        address factory
    ) public view returns (address) {
        return
            vm.computeCreate2Address(
                signatureCheckerSalt(chainId),
                keccak256(type(SignatureChecker).creationCode),
                factory
            );
    }

    /**
     * @notice Precomputes the address of the FiatTokenV2_2 contract
     * @param chainId The ID of the chain we're deploying on
     * @param factory The factory address that would deploy FiatTokenV2_2
     */
    function computeImplAddress(
        uint256 chainId,
        address factory
    ) public view returns (address) {
        return
            vm.computeCreate2Address(
                implSalt(chainId),
                keccak256(type(FiatTokenV2_2).creationCode),
                factory
            );
    }

    /**
     * @notice Precomputes the address of the FiatTokenProxy contract
     * @param chainId The ID of the chain we're deploying on
     * @param factory The factory address that would deploy FiatTokenProxy
     */
    function computeProxyAddress(
        uint256 chainId,
        address factory,
        string memory tokenSymbol
    ) public view returns (address) {
        return
            vm.computeCreate2Address(
                proxySalt(chainId, tokenSymbol),
                keccak256(proxyCreationCode(factory)),
                factory
            );
    }

    /**
     * @notice Precomputes the address of the MasterMinter contract
     * @param chainId The ID of the chain we're deploying on
     * @param factory The factory address that would deploy MasterMinter
     */
    function computeMasterMinterAddress(
        uint256 chainId,
        address factory,
        string memory tokenSymbol
    ) public view returns (address) {
        return
            vm.computeCreate2Address(
                masterMinterSalt(chainId, tokenSymbol),
                keccak256(masterMinterCreationCode(factory)),
                factory
            );
    }
}
