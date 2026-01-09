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

/**
 * @dev Interface of the Injective bank precompile for ERC-20 contracts
 * as defined at https://github.com/InjectiveLabs/solidity-contracts/blob/master/src/Bank.sol
 */
interface IBankModule {
    function mint(address, uint256) external payable returns (bool);

    function balanceOf(address, address) external view returns (uint256);

    function burn(address, uint256) external payable returns (bool);

    function transfer(
        address,
        address,
        uint256
    ) external payable returns (bool);

    function totalSupply(address) external view returns (uint256);

    function metadata(
        address
    ) external view returns (string memory, string memory, uint8);

    function setMetadata(
        string memory,
        string memory,
        uint8
    ) external payable returns (bool);
}
