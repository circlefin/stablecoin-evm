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

// solhint-disable func-name-mixedcase

/**
 * @title FiatTokenV2_2
 * @dev ERC20 Token backed by fiat reserves
 */
contract FiatTokenV2_2 is FiatTokenV2_1 {
    /**
     * @notice Initialize v2.2
     */
    function initializeV2_2(address[] calldata accountsToBlacklist) external {
        require(_initializedVersion == 2, "v2.2 initialized out of order");

        // re-add previously blacklisted accounts to the blacklist
        // by setting the high bit of their balance to 1
        for (uint256 i = 0; i < accountsToBlacklist.length; i++) {
            _blacklist(accountsToBlacklist[i]);
        }

        // additionally blacklist the contract address itself
        _blacklist(address(this));

        _initializedVersion = 3;
    }

    /**
     * @dev Adds account to blacklist
     * @param _account The address to blacklist
     */
    function blacklist(address _account) override external onlyBlacklister {
        _blacklist(_account);
    }

    /**
     * @dev Internal function to process additions to the blacklist
     * @param _account The address to blacklist
     */
    function _blacklist(address _account) internal {
        balances[_account] = balances[_account] | (uint256(1) << 255);
        emit Blacklisted(_account);
    }

    /**
     * @dev Removes account from blacklist
     * @param _account The address to remove from the blacklist
     */
    function unBlacklist(address _account) override external onlyBlacklister {
       _unBlacklist(_account);
    }

    /**
     * @dev Internal function to process removals from the blacklist
     * @param _account The address to remove from the blacklist
     */
    function _unBlacklist(address _account) internal {
        balances[_account] = balances[_account] & ~(uint256(1) << 255);
        emit UnBlacklisted(_account);
    }

    /**
     * @dev Checks if account is blacklisted
     * @param _account The address to check
     */
    function isBlacklisted(address _account) override external view returns (bool) {
        return balances[_account] >> 255 == 1;
    }

    /**
     * @dev Throws if argument account is blacklisted
     * @param _account The address to check
     */
    modifier notBlacklisted(address _account) override {
        require(
            !(balances[_account] >> 255 == 1),
            "Blacklistable: account is blacklisted"
        );
        _;
    }

    /**
     * @dev Get token balance of an account
     * @param account address The account
     */
    function balanceOf(address account)
        external
        override
        view
        returns (uint256)
    {
        // return balance without effect of blacklist high bit
        return balances[account] & ~(uint256(1) << 255);
    }

    /**
     * @dev Get token balance of an account
     * @param account address The account
     */
    function _getBalanceAndBlacklistStatus(address account)
        internal
        view
        returns (uint256, bool)
    {
        uint256 balance = balances[account];
        return (balance & ~(uint256(1) << 255), balance >> 255 == 1);
    }

    /**
     * @notice Internal function to process transfers
     * @param from  Payer's address
     * @param to    Payee's address
     * @param value Transfer amount
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        (uint256 fromBalance, bool isFromBlacklisted) = _getBalanceAndBlacklistStatus(from);

        require(!isFromBlacklisted, "Blacklistable: account is blacklisted");

        require(
            value <= fromBalance,
            "ERC20: transfer amount exceeds balance"
        );

        balances[from] = fromBalance.sub(value);

        (uint256 toBalance, bool isToBlacklisted) = _getBalanceAndBlacklistStatus(to);
        require(!isToBlacklisted, "Blacklistable: account is blacklisted");

        balances[to] = toBalance.add(value);

        emit Transfer(from, to, value);
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
    )
        virtual
        external
        override
        whenNotPaused
        notBlacklisted(msg.sender)
        returns (bool)
    {
        require(
            value <= allowed[from][msg.sender],
            "ERC20: transfer amount exceeds allowance"
        );
        _transfer(from, to, value);

        // allow for infinite allowance gas saving trick
        if (allowed[from][msg.sender] != uint256(-1)) {
            allowed[from][msg.sender] = allowed[from][msg.sender].sub(value);
        }

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
    ) override external whenNotPaused {
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
    ) override external whenNotPaused {
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
     * @dev Function to mint tokens
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint. Must be less than or equal
     * to the minterAllowance of the caller.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address _to, uint256 _amount)
        override
        external
        whenNotPaused
        onlyMinters
        notBlacklisted(msg.sender)
        notBlacklisted(_to)
        returns (bool)
    {
        require(_to != address(0), "FiatToken: mint to the zero address");
        require(_amount > 0, "FiatToken: mint amount not greater than 0");

        uint256 mintingAllowedAmount = minterAllowed[msg.sender];
        require(
            _amount <= mintingAllowedAmount,
            "FiatToken: mint amount exceeds minterAllowance"
        );

        uint256 newTotalSupply = totalSupply_.add(_amount);
        // The supply cap ensures that no account can be unintentionally blacklisted
        // with a high balance
        // Hardcoding the value here as opposed to setting it in storage since it's
        // expected to be static and this avoids an SLOAD
        require(newTotalSupply <= (uint256(1) << 255) - 1, "mint causes total supply to exceed supply cap");

        totalSupply_ = newTotalSupply;

        balances[_to] = balances[_to].add(_amount);
        minterAllowed[msg.sender] = mintingAllowedAmount.sub(_amount);
        emit Mint(msg.sender, _to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }
}