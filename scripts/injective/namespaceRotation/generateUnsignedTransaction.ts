#!/usr/bin/env tsx

/**
 * Generate Unsigned Transaction for Namespace Actor Role Rotation
 *
 * Usage:
 *   NETWORK=<network> ROLE_MANAGER_ADMIN=<evm_address> NEW_POLICY_ADMIN=<evm_address> npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts <USDC_PROXY_ADDRESS>
 *
 * Example:
 *   NETWORK=local ROLE_MANAGER_ADMIN=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 NEW_POLICY_ADMIN=0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts 0x8A791620...
 *   NETWORK=local ROLE_MANAGER_ADMIN=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 NEW_CONTRACT_HOOK_ADMIN=0x123... npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts 0x8A791620...
 */

import * as fs from "fs";
import { ethers } from "ethers";
import { Network } from "@injectivelabs/networks";
import {
  prepareUpdateActorRolesMessage,
  fetchAccountInfo,
} from "../namespaceClient";

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error(
      "Usage: NETWORK=<network> ROLE_MANAGER_ADMIN=<evm_address> NEW_<ROLE>=<evm_address> npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts <USDC_PROXY_ADDRESS>"
    );
    console.error("\nExamples:");
    console.error("  # Rotate policy admin");
    console.error(
      "  NETWORK=local ROLE_MANAGER_ADMIN=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 NEW_POLICY_ADMIN=0x9965... npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts 0x..."
    );
    console.error("\n  # Rotate contract hook admin");
    console.error(
      "  NETWORK=local ROLE_MANAGER_ADMIN=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 NEW_CONTRACT_HOOK_ADMIN=0x123... npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts 0x..."
    );
    console.error("\n  # Rotate role permissions admin");
    console.error(
      "  NETWORK=local ROLE_MANAGER_ADMIN=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 NEW_ROLE_PERMISSIONS_ADMIN=0x456... npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts 0x..."
    );
    console.error(
      "\nNote: Role managers CANNOT be rotated through this script."
    );
    console.error("Note: All addresses must be EVM format (0x...).");
    console.error("Note: Sequence is always set to 0.");
    process.exit(1);
  }

  const usdcProxyAddress = args[0];
  if (!ethers.isAddress(usdcProxyAddress)) {
    console.error(`Invalid EVM address: ${usdcProxyAddress}`);
    process.exit(1);
  }

  // Parse ROLE_MANAGER_ADMIN (must be EVM address)
  const roleManagerAdmin = process.env.ROLE_MANAGER_ADMIN;
  if (!roleManagerAdmin) {
    console.error("ROLE_MANAGER_ADMIN environment variable is required");
    process.exit(1);
  }
  if (!ethers.isAddress(roleManagerAdmin)) {
    console.error(
      `Invalid EVM address for ROLE_MANAGER_ADMIN: ${roleManagerAdmin}`
    );
    process.exit(1);
  }

  const networkStr = process.env.NETWORK?.toLowerCase();
  if (!networkStr || !["local", "testnet", "mainnet"].includes(networkStr)) {
    console.error(
      `Invalid NETWORK: ${networkStr || "(not set)"}. Use: local, testnet, mainnet`
    );
    process.exit(1);
  }

  const networkMap: Record<string, Network> = {
    local: Network.Local,
    testnet: Network.Testnet,
    mainnet: Network.Mainnet,
  };
  const network = networkMap[networkStr];

  // Parse new admin addresses
  const newPolicyAdmin = process.env.NEW_POLICY_ADMIN;
  const newContractHookAdmin = process.env.NEW_CONTRACT_HOOK_ADMIN;
  const newRolePermissionsAdmin = process.env.NEW_ROLE_PERMISSIONS_ADMIN;

  if (!newPolicyAdmin && !newContractHookAdmin && !newRolePermissionsAdmin) {
    console.error("At least one NEW_*_ADMIN environment variable must be set");
    console.error(
      "Options: NEW_POLICY_ADMIN, NEW_CONTRACT_HOOK_ADMIN, NEW_ROLE_PERMISSIONS_ADMIN"
    );
    process.exit(1);
  }

  console.log(`Network: ${networkStr}`);
  console.log(`USDC Proxy: ${usdcProxyAddress}`);

  // Prepare the message using shared function
  const { msg, denom, senderAddress } = await prepareUpdateActorRolesMessage(
    usdcProxyAddress,
    roleManagerAdmin,
    {
      policyAdmin: newPolicyAdmin,
      contractHookAdmin: newContractHookAdmin,
      rolePermissionsAdmin: newRolePermissionsAdmin,
    },
    network
  );

  console.log(`Sender (Injective): ${senderAddress}`);
  console.log(`Sender (EVM): ${roleManagerAdmin}`);

  // Fetch account info from network
  const { accountNumber, chainId } = await fetchAccountInfo(
    senderAddress,
    network
  );

  const sequence = 0;
  console.log(`Account Number: ${accountNumber}`);
  console.log(`Sequence: ${sequence}`);

  // Determine admin types being rotated for filename
  const adminTypes: string[] = [];
  if (newPolicyAdmin) adminTypes.push("policyAdmin");
  if (newContractHookAdmin) adminTypes.push("contractHookAdmin");
  if (newRolePermissionsAdmin) adminTypes.push("rolePermissionsAdmin");
  const adminTypeSuffix = adminTypes.join("-");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFileName = `unsigned-tx-${adminTypeSuffix}-${networkStr}-${timestamp}.json`;

  // Convert MsgUpdateActorRoles to JSON format
  const messageJson = msg.toJSON();

  const output = {
    network: networkStr,
    chainId: chainId,
    accountNumber: accountNumber,
    sequence: sequence,
    message: messageJson,
    metadata: {
      usdcProxyAddress: usdcProxyAddress,
      denom: denom,
      timestamp: new Date().toISOString(),
      description: "Update namespace actor roles",
    },
  };

  fs.writeFileSync(outputFileName, JSON.stringify(output, null, 2));

  console.log(`\n✅ Generated: ${outputFileName}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Sender: ${senderAddress}`);
  console.log(`Account #: ${accountNumber}, Sequence: ${sequence}`);
  console.log(
    `\nNext: ROLE_MANAGER_PRIVATE_KEY=<key> npx tsx scripts/injective/namespaceRotation/signTransaction.ts ${outputFileName}`
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
