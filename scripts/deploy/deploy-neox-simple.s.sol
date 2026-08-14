// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.12;

import "forge-std/console.sol";
import { Script } from "forge-std/Script.sol";
import { FiatTokenV2_2 } from "../../contracts/v2/FiatTokenV2_2.sol";
import { FiatTokenProxy } from "../../contracts/v1/FiatTokenProxy.sol";
import { MasterMinter } from "../../contracts/minting/MasterMinter.sol";

/**
 * @title DeployNeoXSimple
 * @notice Deploy FiatTokenV2_2 (USDC) to NeoX testnet.
 *         Deployer only deploys; proxy admin is handed to the existing
 *         SimpleMultiSig upgrade multisig (2-of-3); token owner / pauser /
 *         blacklister / MasterMinter owner all go to the Gnosis Safe.
 *
 * @dev Architecture:
 *   - Proxy admin  : existing SimpleMultiSig upgrade multisig (2-of-3)
 *                    -> upgradeTo() / changeAdmin() via multisig
 *   - Token owner  : Gnosis Safe (pause/unpause/blacklist/transferOwnership)
 *   - Pauser       : Gnosis Safe
 *   - Blacklister  : Gnosis Safe
 *   - MM owner     : Gnosis Safe (configureController/removeController)
 *   - Minter       : configured manually via Gnosis Safe after deployment
 *                    (configureController + configureMinter)
 *
 *   NOTE: SignatureChecker library must be deployed FIRST and linked via
 *   foundry.toml `libraries` before running this script.
 *
 * Usage:
 *   1. Fill .env with DEPLOYER_PRIVATE_KEY
 *   2. Deploy SignatureChecker:
 *        forge create contracts/util/SignatureChecker.sol:SignatureChecker \
 *          --rpc-url neox-testnet --private-key $DEPLOYER_PRIVATE_KEY --broadcast
 *   3. Update foundry.toml `libraries` with new SignatureChecker address
 *   4. Run:
 *        forge script scripts/deploy/deploy-neox-simple.s.sol \
 *          --rpc-url neox-testnet --broadcast -vvv
 */
contract DeployNeoXSimple is Script {
    // NeoX Mainnet upgrade multisig (Gnosis Safe) - proxy admin.
    // NeoX Mainnet upgrade multisig (Gnosis Safe) — proxy admin.
    address internal constant UPGRADE_MULTISIG = 0x0F378b9433c674Bc5021908b7a4150C6B0C3704E;
    // Gnosis Safe multisig — token owner / pauser / blacklister / MM owner
    address internal constant GNOSIS_SAFE = 0xc81C12BF1fd79DF32Cd7C914c653164bb17B7dB0;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("=============================================");
        console.log("  DeployNeoXSimple - NeoX Testnet");
        console.log("=============================================");
        console.log("  Deployer:      %s", deployer);
        console.log("  UpgradeMultisig (proxy admin): %s", UPGRADE_MULTISIG);
        console.log("  GnosisSafe (owner/pauser/blacklister): %s", GNOSIS_SAFE);
        console.log("");

        // ============================================
        // Phase 1: Deploy contracts
        // ============================================
        console.log("[Phase 1] Deploying contracts...");

        vm.startBroadcast(deployerKey);

        // 1. Implementation — lock with zero-address init
        FiatTokenV2_2 impl = new FiatTokenV2_2();
        impl.initialize("", "", "", 0, address(1), address(1), address(1), address(1));
        impl.initializeV2("");
        impl.initializeV2_1(address(1));
        impl.initializeV2_2(new address[](0), "");
        console.log("  [1/4] Implementation: %s", address(impl));

        // 2. Proxy (deployer = admin initially)
        FiatTokenProxy proxy = new FiatTokenProxy(address(impl));
        console.log("  [2/4] Proxy:          %s", address(proxy));

        // 3. MasterMinter bound to proxy
        MasterMinter masterMinter = new MasterMinter(address(proxy));
        console.log("  [3/4] MasterMinter:   %s", address(masterMinter));

        // 4. Transfer proxy admin to the existing upgrade multisig.
        //    After this, deployer is no longer admin and CAN call the
        //    proxy fallback to initialize the token.
        proxy.changeAdmin(UPGRADE_MULTISIG);
        console.log("  [4/4] Proxy admin -> UpgradeMultisig");

        // 5. Transfer MasterMinter ownership to Gnosis Safe
        masterMinter.transferOwnership(GNOSIS_SAFE);
        console.log("  [5/5] MasterMinter owner -> Gnosis Safe");

        vm.stopBroadcast();

        // ============================================
        // Phase 2: Initialize token through proxy
        //   deployer is no longer admin -> can call via fallback
        // ============================================
        console.log("");
        console.log("[Phase 2] Initializing token (V1 -> V2 -> V2_1 -> V2_2)...");

        FiatTokenV2_2 token = FiatTokenV2_2(address(proxy));

        vm.startBroadcast(deployerKey);
        token.initialize(
            "USD Coin",
            "USDC",
            "USD",
            6,
            address(masterMinter),
            GNOSIS_SAFE, // pauser
            GNOSIS_SAFE, // blacklister
            GNOSIS_SAFE  // owner
        );
        token.initializeV2("USD Coin");
        token.initializeV2_1(GNOSIS_SAFE); // V2_1 blacklister
        token.initializeV2_2(new address[](0), "USDC");
        vm.stopBroadcast();

        console.log("  Token initialized");

        // ============================================
        // Phase 3: Verify deployment
        // ============================================
        console.log("");
        console.log("[Phase 3] Verifying deployment...");

        require(proxy.admin() == UPGRADE_MULTISIG, "FAIL: proxy admin != UpgradeMultisig");
        require(token.owner() == GNOSIS_SAFE, "FAIL: token owner");
        require(token.pauser() == GNOSIS_SAFE, "FAIL: pauser");
        require(token.blacklister() == GNOSIS_SAFE, "FAIL: blacklister");
        require(masterMinter.owner() == GNOSIS_SAFE, "FAIL: mm owner");
        require(address(masterMinter.getMinterManager()) == address(proxy), "FAIL: mm manager");
        require(keccak256(abi.encodePacked(token.name())) == keccak256(abi.encodePacked("USD Coin")), "FAIL: name");
        require(keccak256(abi.encodePacked(token.symbol())) == keccak256(abi.encodePacked("USDC")), "FAIL: symbol");
        require(keccak256(abi.encodePacked(token.currency())) == keccak256(abi.encodePacked("USD")), "FAIL: currency");
        require(uint256(token.decimals()) == 6, "FAIL: decimals");
        console.log("  [OK] All role assignments correct");

        // ============================================
        // Summary
        // ============================================
        console.log("");
        console.log("=============================================");
        console.log("  DEPLOYMENT SUCCESS");
        console.log("=============================================");
        console.log("  Implementation:      %s", address(impl));
        console.log("  Proxy:               %s", address(proxy));
        console.log("  MasterMinter:        %s", address(masterMinter));
        console.log("  ProxyAdmin:          %s (SimpleMultiSig)", UPGRADE_MULTISIG);
        console.log("  Token Owner:         %s", GNOSIS_SAFE);
        console.log("  Pauser:              %s", GNOSIS_SAFE);
        console.log("  Blacklister:         %s", GNOSIS_SAFE);
        console.log("  MasterMinter Owner:  %s", GNOSIS_SAFE);
        console.log("  NOTE: configureController + configureMinter + mint");
        console.log("        must be executed manually via Gnosis Safe UI");
        console.log("=============================================");
    }
}
