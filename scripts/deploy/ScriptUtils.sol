/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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

    /**
     * @notice Helper function that loads minter configuration from a JSON file
     * @param  mintersFileName The name of the JSON file containing minter configuration
     * @return minterControllers Array of minter controller addresses
     * @return minters Array of minter addresses
     * @return minterAllowances Array of minter allowances
     */
    function _loadMinterConfiguration(string memory mintersFileName)
        internal
        view
        returns (
            address[] memory minterControllers,
            address[] memory minters,
            uint256[] memory minterAllowances
        )
    {
        string memory mintersJson = vm.readFile(mintersFileName);
        minterControllers = vm.parseJsonAddressArray(
            mintersJson,
            ".minterControllers"
        );
        minters = vm.parseJsonAddressArray(mintersJson, ".minters");
        minterAllowances = vm.parseJsonUintArray(
            mintersJson,
            ".minterAllowances"
        );
        require(
            minterControllers.length == minters.length &&
                minters.length == minterAllowances.length,
            "Minter arrays must have equal length"
        );
        return (minterControllers, minters, minterAllowances);
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function stringsEqual(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return
            bytes(a).length == bytes(b).length &&
            keccak256(bytes(a)) == keccak256(bytes(b));
    }

    /**
     * @dev Internal function to get the current chain id.
     * @return The current chain id.
     */
    function getChainId() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }
}
