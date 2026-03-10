#!/usr/bin/env tsx

/**
 * Generate Unsigned Transaction for Namespace Actor Role Rotation
 *
 * Usage:
 *   npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts \
 *     --network <network> \
 *     --fiat-token-proxy <EVM address> \
 *     --role-manager-admin <Cosmos Bech32 address> \
 *     --sequence <number> \
 *     [--new-policy-admin <Cosmos Bech32 address>] \
 *     [--new-contract-hook-admin <Cosmos Bech32 address>] \
 *     [--new-role-permissions-admin <Cosmos Bech32 address>]
 *
 * Example:
 *   npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts \
 *     --network local \
 *     --fiat-token-proxy Ox... \
 *     --role-manager-admin inj1... \
 *     --sequence 0 \
 *     --new-policy-admin inj1...
 */

import * as fs from "fs";
import { ethers } from "ethers";
import { Network } from "@injectivelabs/networks";
import { prepareUpdateActorRolesMessage } from "../namespaceClient";
import { fetchAccountInfo } from "../../../integration-tests/injective/helpers/cosmosClient";
import { isValidInjectiveAddress } from "../addressUtil";

interface ParsedArgs {
  network?: string;
  fiatTokenProxy?: string;
  roleManagerAdmin?: string;
  sequence?: string;
  newPolicyAdmin?: string;
  newContractHookAdmin?: string;
  newRolePermissionsAdmin?: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--network":
        parsed.network = nextArg;
        i++;
        break;
      case "--fiat-token-proxy":
        parsed.fiatTokenProxy = nextArg;
        i++;
        break;
      case "--role-manager-admin":
        parsed.roleManagerAdmin = nextArg;
        i++;
        break;
      case "--sequence":
        parsed.sequence = nextArg;
        i++;
        break;
      case "--new-policy-admin":
        parsed.newPolicyAdmin = nextArg;
        i++;
        break;
      case "--new-contract-hook-admin":
        parsed.newContractHookAdmin = nextArg;
        i++;
        break;
      case "--new-role-permissions-admin":
        parsed.newRolePermissionsAdmin = nextArg;
        i++;
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return parsed;
}

function printUsage() {
  console.error("Usage:");
  console.error(
    "  npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts \\"
  );
  console.error("    --network <network> \\");
  console.error("    --fiat-token-proxy <address> \\");
  console.error("    --role-manager-admin <address> \\");
  console.error("    --sequence <number> \\");
  console.error("    [--new-policy-admin <address>] \\");
  console.error("    [--new-contract-hook-admin <address>] \\");
  console.error("    [--new-role-permissions-admin <address>]");
  console.error("\nExamples:");
  console.error("  # Rotate policy admin");
  console.error(
    "  npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts \\"
  );
  console.error("    --network local \\");
  console.error("    --fiat-token-proxy Ox... \\");
  console.error("    --role-manager-admin inj1... \\");
  console.error("    --sequence 0 \\");
  console.error("    --new-policy-admin inj1... \\");
  console.error("\n  # Rotate multiple admins");
  console.error(
    "  npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts \\"
  );
  console.error("    --network local \\");
  console.error("    --fiat-token-proxy Ox... \\");
  console.error("    --role-manager-admin inj1... \\");
  console.error("    --sequence 5 \\");
  console.error("    --new-policy-admin inj1... \\");
  console.error("    --new-contract-hook-admin inj1...");
  console.error("\nNote: Role managers CANNOT be rotated through this script.");
  console.error("Note: All addresses must be Cosmos Bech32 format (inj1...).");
  console.error(
    "Note: --sequence is required and must match the current sequence number of the role manager admin account."
  );
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // Validate required arguments
  if (
    !parsed.network ||
    !parsed.fiatTokenProxy ||
    !parsed.roleManagerAdmin ||
    !parsed.sequence
  ) {
    console.error("Error: Missing required arguments\n");
    printUsage();
    process.exit(1);
  }

  // Validate network
  const networkStr = parsed.network.toLowerCase();
  if (!["local", "testnet", "mainnet"].includes(networkStr)) {
    console.error(
      `Invalid network: ${networkStr}. Use: local, testnet, mainnet`
    );
    process.exit(1);
  }

  // Validate FiatToken proxy address
  if (!ethers.isAddress(parsed.fiatTokenProxy)) {
    console.error(
      `Invalid EVM address for --fiat-token-proxy: ${parsed.fiatTokenProxy}`
    );
    process.exit(1);
  }

  // Validate role manager admin address
  if (!isValidInjectiveAddress(parsed.roleManagerAdmin)) {
    console.error(
      `Invalid Cosmos Bech32 address for --role-manager-admin: ${parsed.roleManagerAdmin}`
    );
    process.exit(1);
  }

  // Validate at least one new admin is provided
  if (
    !parsed.newPolicyAdmin &&
    !parsed.newContractHookAdmin &&
    !parsed.newRolePermissionsAdmin
  ) {
    console.error(
      "Error: At least one of --new-policy-admin, --new-contract-hook-admin, or --new-role-permissions-admin must be provided\n"
    );
    printUsage();
    process.exit(1);
  }

  // Validate new admin addresses if provided
  if (
    parsed.newPolicyAdmin &&
    !isValidInjectiveAddress(parsed.newPolicyAdmin)
  ) {
    console.error(
      `Invalid Cosmos Bech32 address for --new-policy-admin: ${parsed.newPolicyAdmin}`
    );
    process.exit(1);
  }
  if (
    parsed.newContractHookAdmin &&
    !isValidInjectiveAddress(parsed.newContractHookAdmin)
  ) {
    console.error(
      `Invalid Cosmos Bech32 address for --new-contract-hook-admin: ${parsed.newContractHookAdmin}`
    );
    process.exit(1);
  }
  if (
    parsed.newRolePermissionsAdmin &&
    !isValidInjectiveAddress(parsed.newRolePermissionsAdmin)
  ) {
    console.error(
      `Invalid Cosmos Bech32 address for --new-role-permissions-admin: ${parsed.newRolePermissionsAdmin}`
    );
    process.exit(1);
  }

  const networkMap: Record<string, Network> = {
    local: Network.Local,
    testnet: Network.Testnet,
    mainnet: Network.Mainnet,
  };
  const network = networkMap[networkStr];

  console.log(`Network: ${networkStr}`);
  console.log(`FiatToken Proxy: ${parsed.fiatTokenProxy}`);

  // Prepare the message using shared function
  const { msg, denom, senderAddress } = await prepareUpdateActorRolesMessage(
    parsed.fiatTokenProxy,
    parsed.roleManagerAdmin,
    {
      policyAdmin: parsed.newPolicyAdmin,
      contractHookAdmin: parsed.newContractHookAdmin,
      rolePermissionsAdmin: parsed.newRolePermissionsAdmin,
    },
    network
  );

  console.log(`Role manager admin (sender): ${senderAddress}`);

  // Validate and parse sequence number
  const parsedSeq = parseInt(parsed.sequence as string, 10);
  if (isNaN(parsedSeq) || parsedSeq < 0) {
    console.error(`Invalid sequence number: ${parsed.sequence}`);
    process.exit(1);
  }
  const sequence = parsedSeq;

  // Fetch account info from network
  const { accountNumber, chainId } = await fetchAccountInfo(
    senderAddress,
    network
  );

  console.log(`Account Number: ${accountNumber}`);
  console.log(`Sequence: ${sequence}`);

  // Determine admin types being rotated for filename
  const adminTypes: string[] = [];
  if (parsed.newPolicyAdmin) adminTypes.push("policyAdmin");
  if (parsed.newContractHookAdmin) adminTypes.push("contractHookAdmin");
  if (parsed.newRolePermissionsAdmin) adminTypes.push("rolePermissionsAdmin");
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
      fiatTokenProxyAddress: parsed.fiatTokenProxy,
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
    `\nNext: npx tsx scripts/injective/namespaceRotation/signTransaction.ts --private-key <key> --unsigned-tx ${outputFileName}`
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
