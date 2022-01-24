/**
 * SPDX-License-Identifier: MIT
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

import { FiatTokenV2_1 } from "../v2/FiatTokenV2_1.sol";
import { EIP712 } from "../util/EIP712.sol";

/**
 * @title FiatToken
 * @dev ERC20 Token backed by fiat reserves
 */
contract FiatTokenV3 is FiatTokenV2_1 {
    mapping(address => uint256) internal frozenBalances;

    event BalanceFrozen(address indexed _account, uint256 amountFrozen);
    event BalanceUnfrozen(address indexed _account, uint256 amountUnfrozen);

    /**
     * @notice Initialize v3
     */
    function initializeV3() external {
        require(_initializedVersion == 2, "v3 initialized out of order");

        DOMAIN_SEPARATOR = EIP712.makeDomainSeparator(name, "3");

        _initializedVersion = 3;
    }

    /**
     * @dev Freezes an account's balance
     * @param _account The address whose balance will be frozen
     */
    function freezeBalance(address _account) external onlyBlacklister {
        uint256 amountFrozen = balances[_account];

        totalSupply_ = totalSupply_.sub(amountFrozen);
        frozenBalances[_account] = frozenBalances[_account].add(amountFrozen);
        balances[_account] = 0;

        emit BalanceFrozen(_account, amountFrozen);
        emit Transfer(_account, address(0), amountFrozen);
    }

    /**
     * @dev Unfreezes an account's balance
     * @param _account The address whose balance will be unfrozen
     */
    function unfreezeBalance(address _account) external onlyBlacklister {
        uint256 amountUnfrozen = frozenBalances[_account];

        totalSupply_ = totalSupply_.add(amountUnfrozen);
        frozenBalances[_account] = 0;
        balances[_account] = balances[_account].add(amountUnfrozen);

        emit BalanceUnfrozen(_account, amountUnfrozen);
        emit Transfer(address(0), _account, amountUnfrozen);
    }

    /**
     * @dev Get frozen token balance of an account
     * @param account address The account
     */
    function frozenBalanceOf(address account) external view returns (uint256) {
        return frozenBalances[account];
    }

    /**
     * @notice Set spender's allowance over the caller's tokens to be a given
     * value.
     * @param spender   Spender's address
     * @param value     Allowance amount
     * @return True if successful
     */
    function approve(address spender, uint256 value)
        external
        override
        whenNotPaused
        returns (bool)
    {
        _approve(msg.sender, spender, value);
        return true;
    }

    /**
     * @notice Transfer tokens by spending allowance
     * @param from  Payer's address
     * @param to    Payee's address
     * @param value Transfer amount
     * @return True if successful
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override whenNotPaused returns (bool) {
        require(
            value <= allowed[from][msg.sender],
            "ERC20: transfer amount exceeds allowance"
        );
        _transfer(from, to, value);
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(value);
        return true;
    }

    /**
     * @notice Transfer tokens from the caller
     * @param to    Payee's address
     * @param value Transfer amount
     * @return True if successful
     */
    function transfer(address to, uint256 value)
        external
        override
        whenNotPaused
        returns (bool)
    {
        _transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @notice Increase the allowance by a given increment
     * @param spender   Spender's address
     * @param increment Amount of increase in allowance
     * @return True if successful
     */
    function increaseAllowance(address spender, uint256 increment)
        external
        override
        whenNotPaused
        returns (bool)
    {
        _increaseAllowance(msg.sender, spender, increment);
        return true;
    }

    /**
     * @notice Decrease the allowance by a given decrement
     * @param spender   Spender's address
     * @param decrement Amount of decrease in allowance
     * @return True if successful
     */
    function decreaseAllowance(address spender, uint256 decrement)
        external
        override
        whenNotPaused
        returns (bool)
    {
        _decreaseAllowance(msg.sender, spender, decrement);
        return true;
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
    ) external override whenNotPaused {
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
    ) external override whenNotPaused {
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
     * @notice Update allowance with a signed permit
     * @param owner       Token owner's address (Authorizer)
     * @param spender     Spender's address
     * @param value       Amount of allowance
     * @param deadline    Expiration time, seconds since the epoch
     * @param v           v of the signature
     * @param r           r of the signature
     * @param s           s of the signature
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override whenNotPaused {
        _permit(owner, spender, value, deadline, v, r, s);
    }

    /**
     * @notice Version string for the EIP712 domain separator
     * @return Version string
     */
    function version() external override view returns (string memory) {
        return "3";
    }
}
