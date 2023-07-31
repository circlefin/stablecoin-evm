/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2023 CENTRE SECZ
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
