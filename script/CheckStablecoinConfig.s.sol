// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/// @notice Minimal script that prints basic configuration values.
/// @dev This is intentionally simple and can be extended to read
/// deployed addresses or verify invariants.
contract CheckStablecoinConfig is Script {
    function run() external view {
        string memory deployEnv = vm.envOr("DEPLOY_ENV", string("local"));
        string memory rpcUrl = vm.envOr("RPC_URL", string("not-set"));

        console2.log("Stablecoin deployment environment:", deployEnv);
        console2.log("RPC URL:", rpcUrl);
    }
}
