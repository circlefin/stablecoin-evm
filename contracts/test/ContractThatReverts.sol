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
