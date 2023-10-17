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

import { AbstractFiatTokenV2 } from "./AbstractFiatTokenV2.sol";
import { EIP712Domain } from "./EIP712Domain.sol";
import { MessageHashUtils } from "../util/MessageHashUtils.sol";
import { SignatureChecker } from "../util/SignatureChecker.sol";

/**
 * @title EIP-2612
 * @notice Provide internal implementation for gas-abstracted approvals
 */
abstract contract EIP2612 is AbstractFiatTokenV2, EIP712Domain {
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
    bytes32
        public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;

    mapping(address => uint256) private _permitNonces;

    /**
     * @notice Nonces for permit
     * @param owner Token owner's address (Authorizer)
     * @return Next nonce
     */
    function nonces(address owner) external view returns (uint256) {
        return _permitNonces[owner];
    }

    /**
     * @notice Verify a signed approval permit and execute if valid
     * @param owner     Token owner's address (Authorizer)
     * @param spender   Spender's address
     * @param value     Amount of allowance
     * @param deadline  The time at which the signature expires (unix time), or max uint256 value to signal no expiration
     * @param v         v of the signature
     * @param r         r of the signature
     * @param s         s of the signature
     */
    function _permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        _permit(owner, spender, value, deadline, abi.encodePacked(r, s, v));
    }

    /**
     * @notice Verify a signed approval permit and execute if valid
     * @dev EOA wallet signatures should be packed in the order of r, s, v.
     * @param owner      Token owner's address (Authorizer)
     * @param spender    Spender's address
     * @param value      Amount of allowance
     * @param deadline   The time at which the signature expires (unix time), or max uint256 value to signal no expiration
     * @param signature  Signature byte array signed by an EOA wallet or a contract wallet
     */
    function _permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        bytes memory signature
    ) internal {
        require(
            deadline == type(uint256).max || deadline >= now,
            "FiatTokenV2: permit is expired"
        );

        bytes32 typedDataHash = MessageHashUtils.toTypedDataHash(
            _domainSeparator(),
            keccak256(
                abi.encode(
                    PERMIT_TYPEHASH,
                    owner,
                    spender,
                    value,
                    _permitNonces[owner]++,
                    deadline
                )
            )
        );
        require(
            SignatureChecker.isValidSignatureNow(
                owner,
                typedDataHash,
                signature
            ),
            "EIP2612: invalid signature"
        );

        _approve(owner, spender, value);
    }
}
