/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) CENTRE SECZ 2018-2020
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

pragma solidity 0.6.8;

import { FiatTokenV1_1 } from "../v1.1/FiatTokenV1_1.sol";
import { EIP712 } from "../util/EIP712.sol";
import { EIP712Domain } from "./EIP712Domain.sol";
import { GasAbstraction } from "./GasAbstraction.sol";


/**
 * @title FiatToken V2
 */
contract FiatTokenV2 is FiatTokenV1_1, EIP712Domain, GasAbstraction {
    bool internal _initializedV2;

    /**
     * @notice Initialize V2 contract
     * @dev When upgrading to V2, this function must also be invoked
     * simultaneously by using upgradeAndCall instead of upgradeTo.
     */
    function initializeV2(string calldata newName) external {
        require(
            !_initializedV2,
            "FiatTokenV2: contract is already initialized"
        );
        name = newName;
        DOMAIN_SEPARATOR = EIP712.makeDomainSeparator("FiatToken", "2");
        _initializedV2 = true;
    }

    /**
     * @notice Execute a transfer with a signed authorization
     * @param from        Payer's address (Authorizer)
     * @param to          Payee's address
     * @param value       Amount to be transferred
     * @param validAfter  Earliest time this is valid, seconds since the epoch
     * @param validBefore Expiration time, secondss since the epoch
     * @param nonce       Unique nonce
     * @param v           v of the signature
     * @param r           r of the signature
     * @param s           s of the signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused notBlacklisted(from) notBlacklisted(to) {
        _transferWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }

    /**
     * @notice Update allowance with a signed authorization
     * @param owner       Token owner's address (Authorizer)
     * @param spender     Spender's address
     * @param value       Amount of allowance
     * @param validAfter  Earliest time this is valid, seconds since the epoch
     * @param validBefore Expiration time, seconds since the epoch
     * @param nonce       Unique nonce
     * @param v           v of the signature
     * @param r           r of the signature
     * @param s           s of the signature
     */
    function approveWithAuthorization(
        address owner,
        address spender,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused notBlacklisted(owner) notBlacklisted(spender) {
        _approveWithAuthorization(
            owner,
            spender,
            value,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }

    /**
     * @notice Attempt to cancel an authorization
     * @dev Works only if the authorization is not yet used.
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        _cancelAuthorization(authorizer, nonce, v, r, s);
    }
}
