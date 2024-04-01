/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
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

/**
 * @dev A contract that implements the MinterManagementInterface has external
 * functions for adding and removing minters and modifying their allowances.
 * An example is the FiatTokenV1 contract.
 */
interface MinterManagementInterface {
    function isMinter(address _account) external view returns (bool);

    function minterAllowance(address _minter) external view returns (uint256);

    function configureMinter(address _minter, uint256 _minterAllowedAmount)
        external
        returns (bool);

    function removeMinter(address _minter) external returns (bool);
}
