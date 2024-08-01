// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.12;

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import { ScriptUtils } from "./ScriptUtils.sol";
import { DeployImpl } from "./DeployImpl.sol";
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";

contract UpgradeImpl is Script, DeployImpl, ScriptUtils {
    address private proxy;
    address private impl;
    address private proxyAdmin;
    address private l1RemoteToken;

    /**
     * @notice initialize variables from environment
     */
    function setUp() public {
        proxy = vm.envOr("FIAT_TOKEN_PROXY_ADDRESS", address(0));
        impl = vm.envOr("FIAT_TOKEN_IMPLEMENTATION_ADDRESS", address(0));
        proxyAdmin = vm.envAddress("PROXY_ADMIN_ADDRESS");
        l1RemoteToken = vm.envOr("L1_REMOTE_TOKEN", address(0));

        console.log("FIAT_TOKEN_PROXY_ADDRESS: '%s'", proxy);
        console.log("FIAT_TOKEN_IMPLEMENTATION_ADDRESS: '%s'", impl);
        console.log("PROXY_ADMIN_ADDRESS: '%s'", proxyAdmin);
        console.log("L1_REMOTE_TOKEN: '%s'", l1RemoteToken);
    }

    function run() external returns (FiatTokenV2_2) {
        vm.startBroadcast(proxyAdmin);
        FiatTokenProxy _proxy = FiatTokenProxy(payable(proxy));
        FiatTokenV2_2 fiatTokenV2_2 = getOrDeployImpl(impl, l1RemoteToken);
        _proxy.upgradeTo(address(fiatTokenV2_2));
        vm.stopBroadcast();

        return fiatTokenV2_2;
    }
}
