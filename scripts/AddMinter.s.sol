// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.6.12;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

import "../contracts/interface/IFiatTokenV2_cirlce.sol";

contract DeployUSDCe is Script {
    function run(
        address proxyContract,
        address minter,
        uint256 amount
    ) public {
        console.log("Add L2Bridge to minters");
        vm.startBroadcast(msg.sender);
        IFiatTokenV2_Circle(proxyContract).configureMinter(minter, amount);
        vm.stopBroadcast();
    }
}
