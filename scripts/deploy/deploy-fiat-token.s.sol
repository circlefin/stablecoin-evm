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

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import { DeployImpl } from "./DeployImpl.sol";
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";

/**
 * A utility script to directly deploy Fiat Token contract with the latest implementation
 *
 * @dev The proxy needs to be deployed before the master minter; the proxy cannot
 * be initialized until the master minter is deployed.
 */
contract DeployFiatToken is Script, DeployImpl {
    address private immutable THROWAWAY_ADDRESS = address(1);

    address private impl;
    address private masterMinterOwner;
    address private proxyAdmin;
    address private owner;
    address private pauser;
    address private blacklister;
    address private lostAndFound;

    string private tokenName;
    string private tokenSymbol;
    string private tokenCurrency;
    uint8 private tokenDecimals;

    uint256 private deployerPrivateKey;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        tokenName = vm.envString("TOKEN_NAME");
        tokenSymbol = vm.envString("TOKEN_SYMBOL");
        tokenCurrency = vm.envString("TOKEN_CURRENCY");
        tokenDecimals = uint8(vm.envUint("TOKEN_DECIMALS"));

        impl = vm.envOr("FIAT_TOKEN_IMPLEMENTATION_ADDRESS", address(0));
        proxyAdmin = vm.envAddress("PROXY_ADMIN_ADDRESS");
        masterMinterOwner = vm.envAddress("MASTER_MINTER_OWNER_ADDRESS");
        owner = vm.envAddress("OWNER_ADDRESS");

        // Pauser, blacklister, and lost and found addresses can default to owner address
        pauser = vm.envOr("PAUSER_ADDRESS", owner);
        blacklister = vm.envOr("BLACKLISTER_ADDRESS", owner);
        lostAndFound = vm.envOr("LOST_AND_FOUND_ADDRESS", owner);

        deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        console.log("TOKEN_NAME: '%s'", tokenName);
        console.log("TOKEN_SYMBOL: '%s'", tokenSymbol);
        console.log("TOKEN_CURRENCY: '%s'", tokenCurrency);
        console.log("TOKEN_DECIMALS: '%s'", tokenDecimals);
        console.log("FIAT_TOKEN_IMPLEMENTATION_ADDRESS: '%s'", impl);
        console.log("PROXY_ADMIN_ADDRESS: '%s'", proxyAdmin);
        console.log("MASTER_MINTER_OWNER_ADDRESS: '%s'", masterMinterOwner);
        console.log("OWNER_ADDRESS: '%s'", owner);
        console.log("PAUSER_ADDRESS: '%s'", pauser);
        console.log("BLACKLISTER_ADDRESS: '%s'", blacklister);
        console.log("LOST_AND_FOUND_ADDRESS: '%s'", lostAndFound);
    }

    /**
     * @dev For testing only: splitting deploy logic into an internal function to expose for testing
     */
    function _deploy(address _impl)
        internal
        returns (
            FiatTokenV2_2,
            MasterMinter,
            FiatTokenProxy
        )
    {
        vm.startBroadcast(deployerPrivateKey);

        // If there is an existing implementation contract,
        // we can simply point the newly deployed proxy contract to it.
        // Otherwise, deploy the latest implementation contract code to the network.
        FiatTokenV2_2 fiatTokenV2_2 = getOrDeployImpl(_impl);

        FiatTokenProxy proxy = new FiatTokenProxy(address(fiatTokenV2_2));

        // Now that the proxy contract has been deployed, we can deploy the master minter.
        MasterMinter masterMinter = new MasterMinter(address(proxy));

        // Change the master minter to be owned by the master minter owner
        masterMinter.transferOwnership(masterMinterOwner);

        // Now that the master minter is set up, we can go back to setting up the proxy and
        // implementation contracts.
        // Need to change admin first, or the call to initialize won't work
        // since admin can only call methods in the proxy, and not forwarded methods
        proxy.changeAdmin(proxyAdmin);

        // Do the initial (V1) initialization.
        // Note that this takes in the master minter contract's address as the master minter.
        // The master minter contract's owner is a separate address.
        FiatTokenV2_2 proxyAsV2_2 = FiatTokenV2_2(address(proxy));
        proxyAsV2_2.initialize(
            tokenName,
            tokenSymbol,
            tokenCurrency,
            tokenDecimals,
            address(masterMinter),
            pauser,
            blacklister,
            owner
        );

        // Do the V2 initialization
        proxyAsV2_2.initializeV2(tokenName);

        // Do the V2_1 initialization
        proxyAsV2_2.initializeV2_1(lostAndFound);

        // Do the V2_2 initialization
        proxyAsV2_2.initializeV2_2(new address[](0), tokenSymbol);

        vm.stopBroadcast();

        return (fiatTokenV2_2, masterMinter, proxy);
    }

    /**
     * @dev For testing only: Helper function that runs deploy script with a specific implementation address
     */
    function deploy(address _impl)
        external
        returns (
            FiatTokenV2_2,
            MasterMinter,
            FiatTokenProxy
        )
    {
        return _deploy(_impl);
    }

    /**
     * @notice main function that will be run by forge
     */
    function run()
        external
        returns (
            FiatTokenV2_2,
            MasterMinter,
            FiatTokenProxy
        )
    {
        return _deploy(impl);
    }
}
