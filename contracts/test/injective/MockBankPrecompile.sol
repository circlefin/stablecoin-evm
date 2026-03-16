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

import { IBankModule } from "../../interface/injective/IBankModule.sol";

/**
 * @title MockBankPrecompile
 * @dev Mock implementation of the Injective bank precompile for testing
 */
contract MockBankPrecompile is IBankModule {
    mapping(address => mapping(address => uint256)) private balances;
    mapping(address => uint256) private supplies;
    mapping(address => string) private names;
    mapping(address => string) private symbols;
    mapping(address => uint8) private decimalsMap;

    function mint(
        address to,
        uint256 amount
    ) external payable override returns (bool) {
        // msg.sender is the token contract
        balances[msg.sender][to] += amount;
        supplies[msg.sender] += amount;
        return true;
    }

    function balanceOf(
        address tokenContract,
        address account
    ) external view override returns (uint256) {
        return balances[tokenContract][account];
    }

    function burn(
        address from,
        uint256 amount
    ) external payable override returns (bool) {
        // msg.sender is the token contract
        require(balances[msg.sender][from] >= amount, "Insufficient balance");
        balances[msg.sender][from] -= amount;
        supplies[msg.sender] -= amount;
        return true;
    }

    function transfer(
        address from,
        address to,
        uint256 amount
    ) external payable override returns (bool) {
        // msg.sender is the token contract
        require(balances[msg.sender][from] >= amount, "Insufficient balance");
        balances[msg.sender][from] -= amount;
        balances[msg.sender][to] += amount;
        return true;
    }

    function totalSupply(
        address tokenContract
    ) external view override returns (uint256) {
        return supplies[tokenContract];
    }

    function metadata(
        address tokenContract
    ) external view override returns (string memory, string memory, uint8) {
        return (
            names[tokenContract],
            symbols[tokenContract],
            decimalsMap[tokenContract]
        );
    }

    function setMetadata(
        string memory name,
        string memory symbol,
        uint8 _decimals
    ) external payable override returns (bool) {
        names[msg.sender] = name;
        symbols[msg.sender] = symbol;
        decimalsMap[msg.sender] = _decimals;
        return true;
    }
}
