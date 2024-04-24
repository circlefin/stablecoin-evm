// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "forge-std/console.sol"; // solhint-disable no-global-import, no-console
import { Script } from "forge-std/Script.sol";
import {
    OptimismFiatTokenV2_2
} from "../../contracts/v2/OptimismFiatTokenV2_2.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";

/**
 * A utility script to set the token's l2StandardBridge as the minter
 */
contract SetL2StandardBridge is Script {
    /**
     * @notice main function that will be run by forge
     */
    function run(
        address masterMinterOwner,
        OptimismFiatTokenV2_2 optimismFiatTokenV2_2
    ) external {
        address l2StandardBridge = optimismFiatTokenV2_2.bridge();
        if (l2StandardBridge == address(0)) {
            revert("Expected no-zero bridge address");
        }

        vm.startBroadcast(masterMinterOwner);
        MasterMinter masterMinter = MasterMinter(
            optimismFiatTokenV2_2.masterMinter()
        );
        masterMinter.configureController(masterMinterOwner, l2StandardBridge);
        masterMinter.configureMinter(type(uint256).max);
        masterMinter.removeController(masterMinterOwner);
        vm.stopBroadcast();
    }
}
