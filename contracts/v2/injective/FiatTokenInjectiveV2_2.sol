/**
 * Copyright 2026 Circle Internet Group, Inc. All rights reserved.
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

pragma solidity 0.8.24;

import { FiatTokenV2_2 } from "../FiatTokenV2_2.sol";
import { Blacklistable } from "../../v1/Blacklistable.sol";
import { IBankModule } from "../../interface/injective/IBankModule.sol";

contract FiatTokenInjectiveV2_2 is FiatTokenV2_2 {
    /**
     * @notice Cosmos coin structure used by Injective permissions module
     */
    struct Coin {
        uint256 amount;
        string denom;
    }
    address private constant BANK_PRECOMPILE_ADDRESS =
        0x0000000000000000000000000000000000000064;

    function _bankPrecompile() internal pure returns (IBankModule) {
        return IBankModule(BANK_PRECOMPILE_ADDRESS);
    }

    /**
     * @notice Initialize the contract and set the bank module metadata
     */
    function initialize(InitializeData calldata data) external override {
        require(
            _initializedVersion == 0,
            "FiatToken: contract is already initialized"
        );
        require(
            data.newMasterMinter != address(0),
            "FiatToken: new masterMinter is the zero address"
        );
        require(
            data.newPauser != address(0),
            "FiatToken: new pauser is the zero address"
        );
        require(
            data.newBlacklister != address(0),
            "FiatToken: new blacklister is the zero address"
        );
        require(
            data.newOwner != address(0),
            "FiatToken: new owner is the zero address"
        );

        name = data.tokenName;
        symbol = data.tokenSymbol;
        currency = data.tokenCurrency;
        decimals = data.tokenDecimals;
        masterMinter = data.newMasterMinter;
        pauser = data.newPauser;
        blacklister = data.newBlacklister;
        setOwner(data.newOwner);

        for (uint256 i = 0; i < data.accountsToBlacklist.length; ++i) {
            _blacklist(data.accountsToBlacklist[i]);
        }
        _blacklist(address(this));
        _initializedVersion = 3;

        require(
            _bankPrecompile().setMetadata(name, symbol, decimals),
            "IBankModule: setMetadata failed"
        );
    }

    function totalSupply() external view override returns (uint256) {
        return _bankPrecompile().totalSupply(address(this));
    }

    function _balanceOf(
        address _account
    ) internal view override returns (uint256) {
        return _bankPrecompile().balanceOf(address(this), _account);
    }

    /**
     * @inheritdoc Blacklistable
     * @dev Override so only the blacklist bit is written to EVM storage.
     */
    function _blacklist(address _account) internal override {
        balanceAndBlacklistStates[_account] = 1 << 255;
    }

    /**
     * @inheritdoc Blacklistable
     * @dev Override so only the blacklist bit is written to EVM storage.
     */
    function _unBlacklist(address _account) internal override {
        balanceAndBlacklistStates[_account] = 0;
    }

    /**
     * @dev Internal function to mint tokens via bank precompile.
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     */
    function _mint(address _to, uint256 _amount) internal override {
        require(
            _bankPrecompile().mint(_to, _amount),
            "IBankModule: mint failed"
        );
    }

    /**
     * @dev Internal function to burn tokens via bank precompile.
     * @param _from The address to burn tokens from.
     * @param _amount The amount of tokens to burn.
     */
    function _burn(address _from, uint256 _amount) internal override {
        require(
            _bankPrecompile().burn(_from, _amount),
            "IBankModule: burn failed"
        );
    }

    /**
     * @dev Internal function to process transfers.
     * @param from  Payer's address.
     * @param to    Payee's address.
     * @param value Transfer amount.
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        // Validate balance using the bank precompile
        uint256 fromBalance = _balanceOf(from);
        require(value <= fromBalance, "ERC20: transfer amount exceeds balance");

        // Perform the actual transfer via the bank precompile
        require(
            _bankPrecompile().transfer(from, to, value),
            "IBankModule: transfer failed"
        );

        emit Transfer(from, to, value);
    }

    /**
     * @notice Check if a transfer is restricted by permissions
     * @dev Called by Injective permissions module to validate transfers
     * This implements the permissions hook interface required by Injective
     * Checks if contract is paused or if either sender or receiver is blacklisted
     * @param from The sender's address
     * @param to The receiver's address
     * @return isRestricted True if transfer should be blocked
     */
    function isTransferRestricted(
        address from,
        address to,
        Coin calldata /* amount */
    ) external view returns (bool isRestricted) {
        if (paused) {
            return true;
        }
        if (_isBlacklisted(from) || _isBlacklisted(to)) {
            return true;
        }
        return false;
    }
}
