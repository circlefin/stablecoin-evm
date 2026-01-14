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
import { IBankModule } from "../../interface/injective/IBankModule.sol";

contract FiatTokenInjectiveV2_2 is FiatTokenV2_2 {
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

        _bankPrecompile().setMetadata(name, symbol, decimals);
    }

    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return _balanceOf(account);
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
     * @notice Mints fiat tokens to an address.
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint. Must be less than or equal
     * to the minterAllowance of the caller.
     * @return True if the operation was successful.
     */
    function mint(
        address _to,
        uint256 _amount
    )
        external
        override
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

        // Delegate the actual mint and balance/total supply update to the bank precompile
        require(
            _bankPrecompile().mint(_to, _amount),
            "FiatToken: bank mint failed"
        );

        minterAllowed[msg.sender] = mintingAllowedAmount - _amount;
        emit Mint(msg.sender, _to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }
}
