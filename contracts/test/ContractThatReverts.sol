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

// solhint-disable no-unused-vars
// solhint-disable no-complex-fallback
// solhint-disable reason-string

contract ContractThatReverts {
    string private _reason;

    function setReason(string calldata reason) external {
        _reason = reason;
    }

    function reason() external view returns (string memory) {
        return _reason;
    }

    function revertNoReason() external pure {
        revert();
    }

    function revertWithReason(string calldata reasonMsg) external pure {
        revert(reasonMsg);
    }

    fallback() external payable {
        if (bytes(_reason).length > 0) {
            revert(_reason);
        }
        revert();
    }

    receive() external payable {
        if (bytes(_reason).length > 0) {
            revert(_reason);
        }
        revert();
    }
}
