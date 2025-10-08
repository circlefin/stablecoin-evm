/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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

import { TestUtils } from "../TestUtils.sol";
import {
    AddressUtils
} from "../../../../scripts/deploy/create2/AddressUtils.sol";
import {
    DeployFiatTokenCreate2
} from "../../../../scripts/deploy/create2/deploy-fiat-token-create2.s.sol";
import { MasterMinter } from "../../../../contracts/minting/MasterMinter.sol";
import { FiatTokenProxy } from "../../../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../../../contracts/v2/FiatTokenV2_2.sol";

// solhint-disable func-name-mixedcase

contract DeployFiatTokenCreate2Test is TestUtils {
    DeployFiatTokenCreate2 private deployScript;
    AddressUtils private addressUtils;
    address private factoryAddress;

    function setUp() public override {
        TestUtils.setUp();
        vm.setEnv(
            "MINTERS_FILE_NAME",
            "test/scripts/deploy/testdata/test.minters.json"
        );

        vm.prank(deployer);
        deployScript = new DeployFiatTokenCreate2();
        deployScript.setUp();

        addressUtils = new AddressUtils();
        factoryAddress = vm.envAddress("CREATE2_FACTORY_CONTRACT_ADDRESS");
    }

    function test_deployFiatTokenWithEnvConfigured() public {
        (
            FiatTokenV2_2 v2_2,
            MasterMinter masterMinter,
            FiatTokenProxy proxy
        ) = deployScript.run();

        validateImpl(v2_2);
        validateProxy(proxy, address(v2_2), address(masterMinter));
        validateMasterMinterWhenMintersConfigured(masterMinter, address(proxy));
        validateAddressesBlacklistedState(address(proxy), true);

        assertEq(
            address(v2_2),
            addressUtils.computeImplAddress(chainId, factoryAddress)
        );
        assertEq(
            address(proxy),
            addressUtils.computeProxyAddress(
                chainId,
                factoryAddress,
                tokenSymbol
            )
        );
        assertEq(
            address(masterMinter),
            addressUtils.computeMasterMinterAddress(
                chainId,
                factoryAddress,
                tokenSymbol
            )
        );
    }

    function test_deployFiatTokenWithPredeployedImpl() public {
        vm.prank(deployer);
        FiatTokenV2_2 predeployedImpl = new FiatTokenV2_2();

        (, MasterMinter masterMinter, FiatTokenProxy proxy) = deployScript
            .deploy(address(predeployedImpl));

        validateProxy(proxy, address(predeployedImpl), address(masterMinter));
        validateMasterMinterWhenMintersConfigured(masterMinter, address(proxy));
        validateAddressesBlacklistedState(address(proxy), true);

        assertEq(
            address(proxy),
            addressUtils.computeProxyAddress(
                chainId,
                factoryAddress,
                tokenSymbol
            )
        );
        assertEq(
            address(masterMinter),
            addressUtils.computeMasterMinterAddress(
                chainId,
                factoryAddress,
                tokenSymbol
            )
        );
    }

    function test_deployFiatTokenWithMintersNotConfigured() public {
        vm.setEnv(
            "MINTERS_FILE_NAME",
            "test/scripts/deploy/testdata/test.empty.minters.json"
        );

        vm.prank(deployer);
        deployScript = new DeployFiatTokenCreate2();
        deployScript.setUp();

        (
            FiatTokenV2_2 v2_2,
            MasterMinter masterMinter,
            FiatTokenProxy proxy
        ) = deployScript.run();

        validateImpl(v2_2);
        validateProxy(proxy, address(v2_2), address(masterMinter));
        validateMasterMinterWhenMintersNotConfigured(
            masterMinter,
            address(proxy)
        );
        validateAddressesBlacklistedState(address(proxy), true);

        assertEq(
            address(v2_2),
            addressUtils.computeImplAddress(chainId, factoryAddress)
        );
        assertEq(
            address(proxy),
            addressUtils.computeProxyAddress(
                chainId,
                factoryAddress,
                tokenSymbol
            )
        );
        assertEq(
            address(masterMinter),
            addressUtils.computeMasterMinterAddress(
                chainId,
                factoryAddress,
                tokenSymbol
            )
        );
    }
}
