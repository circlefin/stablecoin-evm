#!/usr/bin/env tsx
/**
 * Copyright 2026 Circle Internet Group, Inc. All rights reserved.
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

/**
 * Query Injective namespace for a Fiat Token contract
 *
 * Usage:
 *   npx tsx scripts/injective/queryNamespace.ts --network=<local,testnet,mainnet>
 *
 * Required environment variables (all must be set in .env):
 * - FIAT_TOKEN_PROXY_ADDRESS
 *
 * See .env.example for details.
 */

import * as dotenv from "dotenv";
import { getEthereumAddress } from "@injectivelabs/sdk-ts";
import { queryNamespace, PERMISSIONS } from "./namespaceClient";
import { colors, parseNetworkArgs, validateEnvVariables } from "./utils";

// Load .env file with override
dotenv.config({ override: true });

// ==================================================
// Parse CLI Arguments & Validate Environment Variables
// ==================================================

const network = parseNetworkArgs(process.argv.slice(2));

validateEnvVariables(["FIAT_TOKEN_PROXY_ADDRESS"]);

// These are guaranteed to exist after validation above
const proxyAddress = process.env.FIAT_TOKEN_PROXY_ADDRESS as string;

async function main() {
  console.log(
    `${colors.green}Querying namespace for contract: ${proxyAddress}${colors.reset}`
  );
  console.log(`Network: ${network.toString()}`);
  console.log(`Denom: erc20:${proxyAddress.toLowerCase()}\n`);

  const namespace = await queryNamespace(proxyAddress, network);

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
      const evmAddr = getEthereumAddress(ar.actor);
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
        const evmAddr = getEthereumAddress(rm.manager);
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
