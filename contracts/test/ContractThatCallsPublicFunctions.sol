/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2021 CENTRE SECZ
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
