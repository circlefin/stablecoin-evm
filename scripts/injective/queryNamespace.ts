#!/usr/bin/env tsx

/**
 * Query Injective namespace for a USDC contract
 *
 * Usage:
 *   NETWORK=<network> npx tsx scripts/injective/queryNamespace.ts <proxy_address>
 *
 * Example:
 *   NETWORK=local npx tsx scripts/injective/queryNamespace.ts 0x4f557998871c3F4e1767FfAa74783695f1D5DB99
 */

import { Network } from "@injectivelabs/networks";
import { queryNamespace, PERMISSIONS } from "./namespaceClient";
import * as bech32Lib from "bech32";
import { ethers } from "ethers";

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  cyan: "\x1b[0;36m",
  blue: "\x1b[0;34m",
  magenta: "\x1b[0;35m",
};

function injectiveToEvmAddress(injAddr: string): string {
  try {
    const decoded = bech32Lib.decode(injAddr);
    const bytes = bech32Lib.fromWords(decoded.words);
    return ethers.getAddress("0x" + Buffer.from(bytes).toString("hex"));
  } catch (error) {
    return "(invalid)";
  }
}

async function main() {
  const proxyAddress = process.argv[2] || process.env.USDC_PROXY_ADDRESS;
  if (!proxyAddress) {
    console.error(
      "Usage: NETWORK=<network> npx tsx scripts/injective/queryNamespace.ts <proxy_address>"
    );
    console.error("\nExample:");
    console.error(
      "  NETWORK=local npx tsx scripts/injective/queryNamespace.ts 0x4f557998871c3F4e1767FfAa74783695f1D5DB99"
    );
    process.exit(1);
  }

  const networkStr = process.env.NETWORK?.toLowerCase();
  if (!networkStr || !["local", "testnet", "mainnet"].includes(networkStr)) {
    console.error("Invalid NETWORK. Use: local, testnet, mainnet");
    process.exit(1);
  }

  const networkMap: Record<string, Network> = {
    local: Network.Local,
    testnet: Network.Testnet,
    mainnet: Network.Mainnet,
  };

  console.log(
    `${colors.green}Querying namespace for contract: ${proxyAddress}${colors.reset}`
  );
  console.log(`Network: ${networkStr}`);
  console.log(`Denom: erc20:${proxyAddress.toLowerCase()}\n`);

  const namespace = await queryNamespace(proxyAddress, networkMap[networkStr]);

  // Display namespace information
  console.log(`${colors.cyan}${"=".repeat(60)}`);
  console.log("📋 NAMESPACE INFORMATION");
  console.log(`${"=".repeat(60)}${colors.reset}\n`);

  console.log(`${colors.blue}Denom:${colors.reset} ${namespace.denom}`);
  console.log(
    `${colors.blue}Contract Hook:${colors.reset} ${namespace.contractHook || "(empty)"}`
  );

  // Display role permissions
  console.log(`\n${colors.cyan}${"=".repeat(60)}`);
  console.log("🔐 ROLE PERMISSIONS");
  console.log(`${"=".repeat(60)}${colors.reset}\n`);

  namespace.rolePermissions.forEach(
    (rp: { roleId: number; name: string; permissions: number }) => {
      console.log(
        `${colors.yellow}Role #${rp.roleId}${colors.reset} - ${colors.magenta}${rp.name}${colors.reset}`
      );
      console.log(`  Permissions (decimal): ${rp.permissions}`);
      console.log(`  Permissions (binary):  ${rp.permissions.toString(2)}`);
      console.log(`  Permissions (hex):     0x${rp.permissions.toString(16)}`);

      // Decode common permissions
      const perms: string[] = [];
      if (rp.permissions & PERMISSIONS.MINT) perms.push("Mint");
      if (rp.permissions & PERMISSIONS.RECEIVE) perms.push("Receive");
      if (rp.permissions & PERMISSIONS.BURN) perms.push("Burn");
      if (rp.permissions & PERMISSIONS.SEND) perms.push("Send");
      if (rp.permissions & PERMISSIONS.SUPER_BURN) perms.push("SuperBurn");
      if (rp.permissions & PERMISSIONS.MODIFY_POLICY_MANAGERS)
        perms.push("ModifyPolicyManagers");
      if (rp.permissions & PERMISSIONS.MODIFY_CONTRACT_HOOK)
        perms.push("ModifyContractHook");
      if (rp.permissions & PERMISSIONS.MODIFY_ROLE_PERMISSIONS)
        perms.push("ModifyRolePermissions");
      if (rp.permissions & PERMISSIONS.MODIFY_ROLE_MANAGERS)
        perms.push("ModifyRoleManagers");
      if (perms.length > 0) {
        console.log(`  Decoded: ${perms.join(", ")}`);
      }
      console.log();
    }
  );

  // Display actor roles
  console.log(`${colors.cyan}${"=".repeat(60)}`);
  console.log("👥 ACTOR ROLES");
  console.log(`${"=".repeat(60)}${colors.reset}\n`);

  if (namespace.actorRoles.length === 0) {
    console.log("(No actors assigned)");
  } else {
    namespace.actorRoles.forEach((ar: { actor: string; roles: string[] }) => {
      const evmAddr = injectiveToEvmAddress(ar.actor);
      console.log(
        `${colors.blue}Actor (Injective):${colors.reset} ${ar.actor}`
      );
      console.log(`${colors.blue}Actor (EVM):      ${colors.reset} ${evmAddr}`);
      console.log(
        `${colors.yellow}Roles:            ${colors.reset} ${ar.roles.join(", ")}`
      );
      console.log();
    });
  }

  // Display role managers
  console.log(`${colors.cyan}${"=".repeat(60)}`);
  console.log("⚙️  ROLE MANAGERS");
  console.log(`${"=".repeat(60)}${colors.reset}\n`);

  if (namespace.roleManagers.length === 0) {
    console.log("(No role managers)");
  } else {
    namespace.roleManagers.forEach(
      (rm: { manager: string; roles: string[] }) => {
        const evmAddr = injectiveToEvmAddress(rm.manager);
        console.log(
          `${colors.blue}Manager (Injective):${colors.reset} ${rm.manager}`
        );
        console.log(
          `${colors.blue}Manager (EVM):      ${colors.reset} ${evmAddr}`
        );
        console.log(
          `${colors.yellow}Manages Roles:      ${colors.reset} ${rm.roles.join(", ")}`
        );
        console.log();
      }
    );
  }

  console.log(`${colors.cyan}${"=".repeat(60)}`);
  console.log("✅ QUERY COMPLETE");
  console.log(`${"=".repeat(60)}${colors.reset}\n`);
}

main().catch((error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  if (error.message.includes("Namespace not found")) {
    console.log(
      `\n${colors.yellow}Hint:${colors.reset} The namespace may not have been created yet.`
    );
  }
  process.exit(1);
});
