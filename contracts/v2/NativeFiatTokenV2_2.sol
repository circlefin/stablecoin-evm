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

// TODO: Verify NativeFiatToken behavior with flattened FiatTokenV2_2
pragma solidity 0.8.24;

import { FiatTokenV2_2 } from "./FiatTokenV2_2.sol";
import { INativeCoinAuthority } from "../interface/NativeFiatToken/INativeCoinAuthority.sol";
import { INativeCoinControl } from "../interface/NativeFiatToken/INativeCoinControl.sol";

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
    /// @dev Interface to the Native Coin Authority
    INativeCoinAuthority public constant NATIVE_COIN_AUTHORITY =
        INativeCoinAuthority(0x1800000000000000000000000000000000000000);

    /// @dev Interface to the Native Coin Control
    INativeCoinControl public constant NATIVE_COIN_CONTROL =
        INativeCoinControl(0x1800000000000000000000000000000000000001);

    /// @dev The factor of decimals conversion
    // E.g. for a 6-decimal token, factor = 10**12 = 1e12
    uint256 public constant DECIMALS_SCALING_FACTOR = 10 ** 12;

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
        returns (bool)
    {
        require(
            value <= allowed[from][msg.sender],
            "ERC20: transfer amount exceeds allowance"
        );
        allowed[from][msg.sender] = allowed[from][msg.sender] - value;
        _transfer(from, to, value);
        return true;
    }

    /**
     * @notice Transfers tokens from the caller.
     * @param to    Payee's address.
     * @param value Transfer amount.
     * @return True if the operation was successful.
     */
    function transfer(
        address to,
        uint256 value
    ) external virtual override whenNotPaused returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @dev Internal implementation of transfer that delegates the actual
     * token movement to the NATIVE_COIN_AUTHORITY contract. This overrides
     * the parent contract implementation to:
     * 1. Convert the value from sourceDecimals (6) to 18 decimals for native coin
     * 2. Use the authority contract instead of modifying internal state variables
     * 3. Still emit standard ERC20 Transfer events for compatibility
     * @param from  Payer's address.
     * @param to    Payee's address.
     * @param value Transfer amount in sourceDecimals.
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
     * Unlike the parent contract implementation, this directly uses the chain's
     * native balance rather than internal state variables.
     * @param _account  The address of the account.
     * @return The converted balance in sourceDecimals.
     */
    function _balanceOf(
        address _account
    ) internal view virtual override returns (uint256) {
        uint256 nativeBalance = _account.balance;
        return _from18Decimals(nativeBalance, DECIMALS_SCALING_FACTOR);
    }

    /**
     * @notice Mints tokens to a specified address.
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     * @return True if the operation was successful.
     * @dev This function:
     * 1. Requires the caller to be a minter and not blacklisted
     * 2. Verifies the recipient is not blacklisted
     * 3. Checks that amount doesn't exceed minter's allowance
     * 4. Delegates the actual minting to NATIVE_COIN_AUTHORITY
     * 5. Updates minter's remaining allowance
     * 6. Emits Mint and Transfer events
     */
    function mint(
        address _to,
        uint256 _amount
    )
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

        // Safe arithmetic: _amount <= mintingAllowedAmount, cannot underflow
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
     * @param _amount The amount of tokens to be burned.
     * @dev This function:
     * 1. Requires the caller to be a minter and not blacklisted
     * 2. Verifies the amount is positive and doesn't exceed caller's balance
     * 3. Delegates the actual burning to NATIVE_COIN_AUTHORITY
     * 4. Emits standard Burn and Transfer events
     */
    function burn(
        uint256 _amount
    ) external virtual override onlyMinters whenNotPaused {
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
     * @return The total supply in 6 decimals (token precision).
     * @dev This function delegates to the NATIVE_COIN_AUTHORITY contract
     * to fetch the native supply (in 18 decimals), then converts it down
     * to 6 decimals before returning. Supply is not tracked internally.
     */
    function totalSupply() external view virtual override returns (uint256) {
        uint256 nativeSupply = NATIVE_COIN_AUTHORITY.totalSupply();
        return _from18Decimals(nativeSupply, DECIMALS_SCALING_FACTOR);
    }

    /**
     * @dev Internal implementation to check if an account is blacklisted.
     * Overrides the parent contract implementation to delegate blacklist
     * status checking to the NATIVE_COIN_CONTROL contract instead of using
     * internal state variables.
     * @param _account  The address to check.
     * @return True if the account is blacklisted, false otherwise.
     */
    function _isBlacklisted(
        address _account
    ) internal view virtual override returns (bool) {
        return NATIVE_COIN_CONTROL.isBlocklisted(_account);
    }

    /**
     * @dev Helper method that sets the blacklist state of an account.
     * @param _account         The address of the account.
     * @param _shouldBlacklist True if the account should be blacklisted, false if the account should be unblacklisted.
     */
    function _setBlacklistState(
        address _account,
        bool _shouldBlacklist
    ) internal virtual override {
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
     * @notice Execute a transfer with a signed authorization
     * @dev EOA wallet signatures should be packed in the order of r, s, v.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param signature     Signature bytes signed by an EOA wallet or a contract wallet
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    ) external virtual override whenNotPaused {
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
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address
     * matches the caller of this function to prevent front-running attacks.
     * EOA wallet signatures should be packed in the order of r, s, v.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param signature     Signature bytes signed by an EOA wallet or a contract wallet
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    ) external virtual override whenNotPaused {
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
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
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
    ) external virtual override whenNotPaused {
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
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address
     * matches the caller of this function to prevent front-running attacks.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
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
    ) external virtual override whenNotPaused {
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
     * @param amount The amount in source decimals
     * @param factor The factor of decimals conversion
     * @return The amount in 18 decimals
     */
    function _to18Decimals(
        uint256 amount,
        uint256 factor
    ) internal pure returns (uint256) {
        return amount * factor;
    }

    /**
     * @dev Helper function to convert from 18 decimals to source decimals
     * @param amount The amount in 18 decimals
     * @param factor The factor of decimals conversion
     * @return The amount in source decimals
     * @dev Division truncates the fractional part (rounds down) by design.
     * This precision loss is expected and intentional.
     */
    function _from18Decimals(
        uint256 amount,
        uint256 factor
    ) internal pure returns (uint256) {
        return amount / factor;
    }
}
