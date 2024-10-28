/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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

import { ContractWithPublicFunctions } from "./ContractWithPublicFunctions.sol";

contract ContractThatCallsPublicFunctions {
    function callSetFoo(address contractAddress, string calldata foo)
        external
        returns (bool)
    {
        return ContractWithPublicFunctions(contractAddress).setFoo(foo);
    }

    function callGetFoo(address contractAddress)
        external
        view
        returns (string memory)
    {
        return ContractWithPublicFunctions(contractAddress).getFoo();
    }

    function callSetBar(address contractAddress, uint256 bar)
        external
        returns (bool)
    {
        return ContractWithPublicFunctions(contractAddress).setBar(bar);
    }

    function callGetBar(address contractAddress)
        external
        view
        returns (uint256)
    {
        return ContractWithPublicFunctions(contractAddress).getBar();
    }
}
