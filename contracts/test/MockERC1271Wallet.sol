/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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

import { ECRecover } from "../util/ECRecover.sol";
import { IERC1271 } from "../interface/IERC1271.sol";

/**
 * @title MockERC1271Wallet
 * @dev An ERC-1271 compatible wallet using standard ECDSA validation.
 */
contract MockERC1271Wallet is IERC1271 {
    address private _owner;

    constructor(address owner) public {
        _owner = owner;
    }

    function isValidSignature(bytes32 hash, bytes memory signature)
        external
        override
        view
        returns (bytes4 magicValue)
    {
        address recovered = ECRecover.recover(hash, signature);
        return
            recovered == _owner
                ? IERC1271.isValidSignature.selector
                : bytes4(0);
    }
}

/**
 * @title MockERC1271WalletReturningBytes32
 * @dev Used to check against unexpected reverts from abi.decode when raw bytes data overflow the target type.
 * Adapted from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/874c2d3c02ec1bce6af9a30bc828d3fe2079136b/contracts/mocks/ERC1271WalletMock.sol
 */
contract MockERC1271WalletReturningBytes32 is IERC1271 {
    function isValidSignature(bytes32, bytes memory)
        external
        override
        view
        returns (bytes4)
    {
        assembly {
            mstore(
                0,
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
            )
            return(0, 32)
        }
    }
}

/**
 * @title MockERC1271WalletCustomValidation
 * @dev An ERC-1271 compatible wallet that performs custom signature validation
 */
contract MockERC1271WalletWithCustomValidation is IERC1271 {
    address private _owner;
    bool private _signatureValid;

    constructor(address owner) public {
        _owner = owner;
    }

    function setSignatureValid(bool signatureValid) external {
        _signatureValid = signatureValid;
    }

    function isValidSignature(bytes32, bytes memory)
        external
        override
        view
        returns (bytes4 magicValue)
    {
        return _signatureValid ? IERC1271.isValidSignature.selector : bytes4(0);
    }
}

/**
 * @title MockStateModifyingERC1271Wallet
 * @dev An ERC-1271 compatible wallet that attempts to modify contract state.
 */
contract MockStateModifyingERC1271Wallet {
    bool private _evoked;

    function evoked() external view returns (bool) {
        return _evoked;
    }

    function isValidSignature(bytes32, bytes memory)
        external
        returns (bytes4 magicValue)
    {
        _evoked = true;
        return IERC1271.isValidSignature.selector;
    }
}
