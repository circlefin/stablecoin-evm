// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.12;

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import { ScriptUtils } from "./ScriptUtils.sol";
import { DeployImpl } from "./DeployImpl.sol";
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";
import {
    OptimismMintableFiatTokenV2_2
} from "../../contracts/v2/OptimismMintableFiatTokenV2_2.sol";
import {
    IOptimismMintableERC20,
    IOptimismMintableFiatToken
} from "../../contracts/v2/IOptimismMintableFiatToken.sol";

interface IL2StandardBridge {
    function MESSENGER() external view returns (address);

    function OTHER_BRIDGE() external view returns (address);

    function bridgeERC20(
        address _localToken,
        address _remoteToken,
        uint256 _amount,
        uint32 _minGasLimit,
        bytes memory _extraData
    ) external;

    function bridgeERC20To(
        address _localToken,
        address _remoteToken,
        address _to,
        uint256 _amount,
        uint32 _minGasLimit,
        bytes memory _extraData
    ) external;

    function bridgeETH(uint32 _minGasLimit, bytes memory _extraData) external;

    function bridgeETHTo(
        address _to,
        uint32 _minGasLimit,
        bytes memory _extraData
    ) external;

    function deposits(address, address) external view returns (uint256);

    function finalizeBridgeERC20(
        address _localToken,
        address _remoteToken,
        address _from,
        address _to,
        uint256 _amount,
        bytes memory _extraData
    ) external;

    function finalizeBridgeETH(
        address _from,
        address _to,
        uint256 _amount,
        bytes memory _extraData
    ) external;

    function finalizeDeposit(
        address _l1Token,
        address _l2Token,
        address _from,
        address _to,
        uint256 _amount,
        bytes memory _extraData
    ) external;

    function initialize(address _otherBridge) external;

    function l1TokenBridge() external view returns (address);

    function messenger() external view returns (address);

    function otherBridge() external view returns (address);

    function paused() external view returns (bool);

    function version() external view returns (string memory);

    function withdraw(
        address _l2Token,
        uint256 _amount,
        uint32 _minGasLimit,
        bytes memory _extraData
    ) external;

    function withdrawTo(
        address _l2Token,
        address _to,
        uint256 _amount,
        uint32 _minGasLimit,
        bytes memory _extraData
    ) external;
}

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

        // SIMULATE WITHDRAW BRIDGE TRANSFER
        address user = 0xf276E7A22F0059656f4781286A33Da62AB751E3A;
        vm.startBroadcast(user);

        address bridgeProxyAddr = 0x4200000000000000000000000000000000000010;

        uint256 balanceOf = FiatTokenV2_2(proxy).balanceOf(
            0xf276E7A22F0059656f4781286A33Da62AB751E3A
        );
        console.log("balanceOf: '%s'", balanceOf);

        // burn tokens
        // FiatTokenV2_2(proxy).burn(user, 100);

        IL2StandardBridge bridge = IL2StandardBridge(bridgeProxyAddr);
        bytes memory _extraData = abi.encode(0x0);
        bridge.bridgeERC20(
            address(_proxy),
            l1RemoteToken,
            1000000,
            200000,
            _extraData
        );

        balanceOf = FiatTokenV2_2(proxy).balanceOf(
            0xf276E7A22F0059656f4781286A33Da62AB751E3A
        );
        console.log("new balanceOf: '%s'", balanceOf);

        vm.stopBroadcast();

        return fiatTokenV2_2;
    }
}
