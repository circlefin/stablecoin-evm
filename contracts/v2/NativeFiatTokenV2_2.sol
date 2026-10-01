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

import { FiatTokenV2_2 } from "./FiatTokenV2_2.sol";
import {
    INativeCoinAuthority
} from "../interface/NativeFiatToken/INativeCoinAuthority.sol";
import {
    INativeCoinControl
} from "../interface/NativeFiatToken/INativeCoinControl.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

// solhint-disable func-name-mixedcase

/**
 * @title NativeFiatTokenV2_2
 * @dev ERC20 Token that uses blockchain's native coin as its underlying asset.
 * This contract:
 * 1. Provides an ERC20-compatible view and interface over the blockchain's native coin
 * 2. Delegates all balance operations to the Native Coin Authority
 * 3. Maintains a 6-decimal token representation while the native coin uses 18 decimals
 * 4. Inherits standard ERC20 functionality and permissioning from FiatTokenV2_2
 * 5. Uses the native balance from the account as the source of truth for token balances
 */
contract NativeFiatTokenV2_2 is FiatTokenV2_2 {
    using SafeMath for uint256;

    /// @dev Interface to the Native Coin Authority
    INativeCoinAuthority
        public constant NATIVE_COIN_AUTHORITY = INativeCoinAuthority(
        0x1800000000000000000000000000000000000000
    );

    /// @dev Interface to the Native Coin Control
    INativeCoinControl public constant NATIVE_COIN_CONTROL = INativeCoinControl(
        0x1800000000000000000000000000000000000001
    );

    /// @dev The factor of decimals conversion
    // E.g. for a 6-decimal token, factor = 10**12 = 1e12
    uint256 public constant DECIMALS_SCALING_FACTOR = 10**12;

    /**
     * @notice Transfers tokens from an address to another by spending the caller's allowance.
     * @dev The caller must have some fiat token allowance on the payer's tokens.
     * @param from  Payer's address.
     * @param to    Payee's address.
     * @param value Transfer amount.
     * @return True if the operation was successful.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        external
        virtual
        override
        whenNotPaused
        notBlacklisted(msg.sender)
        notBlacklisted(from)
        notBlacklisted(to)
        returns (bool)
    {
        require(
            value <= allowed[from][msg.sender],
            "ERC20: transfer amount exceeds allowance"
        );
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @notice Transfers tokens from the caller.
     * @param to    Payee's address.
     * @param value Transfer amount.
     * @return True if the operation was successful.
     */
    function transfer(address to, uint256 value)
        external
        virtual
        override
        whenNotPaused
        notBlacklisted(msg.sender)
        notBlacklisted(to)
        returns (bool)
    {
        // Security fix: restored missing notBlacklisted modifiers to prevent blacklisted accounts
        // from directly moving funds on the native-fiat deployment.
        _transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @dev Internal implementation of transfer that delegates the actual
     * token movement to the NATIVE_COIN_AUTHORITY contract.
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        uint256 valueIn18Decimals = _to18Decimals(
            value,
            DECIMALS_SCALING_FACTOR
        );
        require(
            valueIn18Decimals <= from.balance,
            "ERC20: transfer amount exceeds balance"
        );

        require(
            NATIVE_COIN_AUTHORITY.transfer(from, to, valueIn18Decimals),
            "Native transfer failed"
        );
        emit Transfer(from, to, value);
    }

    /**
     * @dev Internal implementation of balanceOf that retrieves the account's
     * native coin balance and converts it from 18 decimals to the sourceDecimals (6).
     */
    function _balanceOf(address _account)
        internal
        virtual
        override
        view
        returns (uint256)
    {
        uint256 nativeBalance = _account.balance;
        return _from18Decimals(nativeBalance, DECIMALS_SCALING_FACTOR);
    }

    /**
     * @notice Mints tokens to a specified address.
     */
    function mint(address _to, uint256 _amount)
        external
        virtual
        override
        onlyMinters
        notBlacklisted(msg.sender)
        whenNotPaused
        returns (bool)
    {
        require(_to != address(0), "FiatToken: mint to the zero address");
        require(_amount > 0, "FiatToken: mint amount not greater than 0");

        uint256 mintingAllowedAmount = minterAllowed[msg.sender];
        require(
            _amount <= mintingAllowedAmount,
            "FiatToken: mint amount exceeds minterAllowance"
        );

        minterAllowed[msg.sender] = mintingAllowedAmount - _amount;

        require(
            NATIVE_COIN_AUTHORITY.mint(
                _to,
                _to18Decimals(_amount, DECIMALS_SCALING_FACTOR)
            ),
            "Native mint failed"
        );

        emit Mint(msg.sender, _to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    /**
     * @notice Allows a minter to burn their own tokens.
     */
    function burn(uint256 _amount)
        external
        virtual
        override
        onlyMinters
        whenNotPaused
    {
        require(_amount > 0, "FiatToken: burn amount not greater than 0");
        uint256 amountIn18Decimals = _to18Decimals(
            _amount,
            DECIMALS_SCALING_FACTOR
        );
        require(
            msg.sender.balance >= amountIn18Decimals,
            "FiatToken: burn amount exceeds balance"
        );

        require(
            NATIVE_COIN_AUTHORITY.burn(msg.sender, amountIn18Decimals),
            "Native burn failed"
        );

        emit Burn(msg.sender, _amount);
        emit Transfer(msg.sender, address(0), _amount);
    }

    /**
     * @notice Gets the total supply of tokens in circulation.
     */
    function totalSupply() external virtual override view returns (uint256) {
        uint256 nativeSupply = NATIVE_COIN_AUTHORITY.totalSupply();
        return _from18Decimals(nativeSupply, DECIMALS_SCALING_FACTOR);
    }

    /**
     * @dev Internal implementation to check if an account is blacklisted.
     */
    function _isBlacklisted(address _account)
        internal
        virtual
        override
        view
        returns (bool)
    {
        return NATIVE_COIN_CONTROL.isBlocklisted(_account);
    }

    /**
     * @dev Helper method that sets the blacklist state of an account.
     */
    function _setBlacklistState(address _account, bool _shouldBlacklist)
        internal
        virtual
        override
    {
        if (_shouldBlacklist) {
            require(
                _account != this.owner(),
                "NativeFiatTokenV2_2: cannot blacklist owner"
            );
            NATIVE_COIN_CONTROL.blocklist(_account);
        } else {
            NATIVE_COIN_CONTROL.unBlocklist(_account);
        }
    }

    /**
     * @notice Execute a transfer with a signed authorization (packed bytes signature)
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    )
        external
        virtual
        override
        whenNotPaused
        notBlacklisted(from)
        notBlacklisted(to)
    {
        // Security fix: ensure the packed signature overload enforces blacklist modifiers,
        // preventing blacklisted accounts from circumventing controls via bytes-signature auth.
        _transferWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            signature
        );
    }

    /**
     * @notice Receive a transfer with a signed authorization from the payer (packed bytes signature)
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    )
        external
        virtual
        override
        whenNotPaused
        notBlacklisted(from)
        notBlacklisted(to)
    {
        // Security fix: ensure the packed signature overload enforces blacklist modifiers.
        _receiveWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            signature
        );
    }

    /**
     * @notice Execute a transfer with a signed authorization (v, r, s)
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
    )
        external
        virtual
        override
        whenNotPaused
        notBlacklisted(from)
        notBlacklisted(to)
    {
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
     * @notice Receive a transfer with a signed authorization from the payer (v, r, s)
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        external
        virtual
        override
        whenNotPaused
        notBlacklisted(from)
        notBlacklisted(to)
    {
        _receiveWithAuthorization(
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
     * @dev Helper function to convert from source decimals to 18 decimals
     */
    function _to18Decimals(uint256 amount, uint256 factor)
        internal
        pure
        returns (uint256)
    {
        return amount.mul(factor);
    }

    /**
     * @dev Helper function to convert from 18 decimals to source decimals
     */
    function _from18Decimals(uint256 amount, uint256 factor)
        internal
        pure
        returns (uint256)
    {
        return amount.div(factor);
    }
}