/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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
pragma experimental ABIEncoderV2; // needed for compiling older solc versions: https://github.com/foundry-rs/foundry/issues/4376

import { Script } from "forge-std/Script.sol";

/**
 * Shared utilities for scripts. It inherits the Script contract in order
 * to access vm cheatcodes.
 */
contract ScriptUtils is Script {
    /**
     * @notice helper function that loads local json
     */
    function _loadAccountsToBlacklist(string memory blacklistFileName)
        internal
        view
        returns (address[] memory)
    {
        string memory json = vm.readFile(blacklistFileName);
        return vm.parseJsonAddressArray(json, "");
    }
}
