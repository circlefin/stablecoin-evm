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
import {
    ICreate2Factory
} from "../../../contracts/interface/ICreate2Factory.sol";
import { SignatureChecker } from "../../../contracts/util/SignatureChecker.sol";

/**
 * @notice A utility contract that defines reuseable contract salt and address computation functions
 */
contract AddressUtils {
    /**
     * @dev Salt values for SignatureChecker, FiatTokenProxy, FiatTokenV2_2, and MasterMinter as defined as follows
     * TODO(SE-1931): Define salt values based on token symbol and chain ID.
     */
    function signatureCheckerSalt() public pure returns (bytes32 salt) {
        return keccak256("SignatureChecker");
    }

    function proxySalt() public pure returns (bytes32 salt) {
        return keccak256("FiatTokenProxy");
    }

    function implSalt() public pure returns (bytes32 salt) {
        return keccak256("FiatTokenV2_2");
    }

    function masterMinterSalt() public pure returns (bytes32 salt) {
        return keccak256("MasterMinter");
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
    function proxyCreationCode(address factory)
        public
        pure
        returns (bytes memory creationCode)
    {
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
    function masterMinterCreationCode(address factory)
        public
        pure
        returns (bytes memory creationCode)
    {
        return
            abi.encodePacked(
                type(MasterMinter).creationCode,
                abi.encode(factory) // Set to factory initially
            );
    }

    /**
     * @notice Precomputes the address of the SignatureChecker contract
     * @param factory The factory address that would deploy SignatureChecker
     */
    function computeSignatureCheckerAddress(address factory)
        public
        view
        returns (address)
    {
        return
            ICreate2Factory(factory).computeAddress(
                signatureCheckerSalt(),
                keccak256(type(SignatureChecker).creationCode)
            );
    }

    /**
     * @notice Precomputes the address of the FiatTokenV2_2 contract
     * @param factory The factory address that would deploy FiatTokenV2_2
     */
    function computeImplAddress(address factory) public view returns (address) {
        return
            ICreate2Factory(factory).computeAddress(
                implSalt(),
                keccak256(type(FiatTokenV2_2).creationCode)
            );
    }

    /**
     * @notice Precomputes the address of the FiatTokenProxy contract
     * @param factory The factory address that would deploy FiatTokenProxy
     */
    function computeProxyAddress(address factory)
        public
        view
        returns (address)
    {
        return
            ICreate2Factory(factory).computeAddress(
                proxySalt(),
                keccak256(proxyCreationCode(factory))
            );
    }

    /**
     * @notice Precomputes the address of the MasterMinter contract
     * @param factory The factory address that would deploy MasterMinter
     */
    function computeMasterMinterAddress(address factory)
        public
        view
        returns (address)
    {
        return
            ICreate2Factory(factory).computeAddress(
                masterMinterSalt(),
                keccak256(masterMinterCreationCode(factory))
            );
    }
}
