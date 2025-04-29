// Copyright 2025 Circle Internet Group, Inc. All rights reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pragma solidity 0.6.12;

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import "forge-std/Script.sol";
import { AddressUtils } from "./AddressUtils.sol";

import { FiatTokenV2_2 } from "../../../contracts/v2/FiatTokenV2_2.sol";
import { FiatTokenProxy } from "../../../contracts/v1/FiatTokenProxy.sol";
import { MasterMinter } from "../../../contracts/minting/MasterMinter.sol";
import { SignatureChecker } from "../../../contracts/util/SignatureChecker.sol";

/**
 * A utility script to precompute contract addresses for FiatTokenV2_2, FiatTokenProxy, MasterMinter, and SignatureChecker.
 */
contract PrecomputeContractAddresses is Script, AddressUtils {
    address private factory;
    string private tokenSymbol;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        factory = vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS");
        tokenSymbol = vm.envString("TOKEN_SYMBOL");

        console.log("CREATE2_FACTORY_CONTRACT_ADDRESS: '%s'", factory);
        console.log("TOKEN_SYMBOL: '%s'", tokenSymbol);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run() external {
        console.log("Precomputed contract addresses:");
        console.log(
            "SignatureChecker: ",
            computeSignatureCheckerAddress(factory)
        );
        console.log("FiatTokenV2_2: ", computeImplAddress(factory));
        console.log(
            "FiatTokenProxy: ",
            computeProxyAddress(factory, tokenSymbol)
        );
        console.log(
            "MasterMinter: ",
            computeMasterMinterAddress(factory, tokenSymbol)
        );
    }
}
