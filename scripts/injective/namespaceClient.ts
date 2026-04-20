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

// Node.js 18+ native fetch support
/* eslint-disable @typescript-eslint/no-explicit-any */
declare function fetch(
  input: string,
  init?: any
): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<any>;
}>;
/* eslint-enable @typescript-eslint/no-explicit-any */

import {
  PrivateKey,
  ChainGrpcPermissionsApi,
  MsgBroadcasterWithPk,
  MsgUpdateActorRoles,
  createTransaction,
  TxRestApi,
} from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";
import { MsgCreateNamespaceWrapper as MsgCreateNamespace } from "./proto/namespaceWrapper";
import { getErc20Denom } from "../../integration-tests/injective/helpers/cosmosClient";
import {
  validateEvmAddress,
  validatePrivateKey,
  getInjectiveAddressFromPrivateKey,
  normalizePrivateKey,
  validateInjectiveAddress,
} from "./addressUtil";

// Expected role IDs for FiatToken namespace
export const ROLE_IDS = {
  EVERYONE: 0,
  POLICY_ADMIN: 1,
  CONTRACT_HOOK_ADMIN: 2,
  ROLE_PERMISSIONS_ADMIN: 3,
  ROLE_MANAGERS_ADMIN: 4,
};

// Permission bit flags
// Refer to https://docs.injective.network/developers-native/injective/permissions/01_concepts
export const PERMISSIONS = {
  // Basic token operations
  MINT: 1 << 0, // 1
  RECEIVE: 1 << 1, // 2
  BURN: 1 << 2, // 4
  SEND: 1 << 3, // 8
  SUPER_BURN: 1 << 4, // 16

  // Management permissions
  MODIFY_POLICY_MANAGERS: 1 << 27, // 134217728
  MODIFY_CONTRACT_HOOK: 1 << 28, // 268435456
  MODIFY_ROLE_PERMISSIONS: 1 << 29, // 536870912
  MODIFY_ROLE_MANAGERS: 1 << 30, // 1073741824

  // Combined role permissions
  // EVERYONE role: only RECEIVE and SEND (not MINT/BURN which are administrative)
  EVERYONE: (1 << 1) | (1 << 3), // 10 (Receive | Send)
};

/**
 * Configuration for creating a new Injective namespace
 */
export interface NamespaceConfig {
  fiatTokenProxyAddress: string;
  policyAdmin: string;
  contractHookAdmin: string;
  rolePermissionsAdmin: string;
  roleManagersAdmin: string;
  signerPrivateKey: string;
  network?: Network;
  useRestApi?: boolean;
}

/**
 * Response from querying a namespace
 */
export interface NamespaceResponse {
  denom: string;
  wasmHook?: string;
  contractHook?: string;
  evmHook?: string;
  rolePermissions: Array<{ roleId: number; name: string; permissions: number }>;
  actorRoles: Array<{ actor: string; roles: string[] }>;
  roleManagers: Array<{ manager: string; roles: string[] }>;
}

/**
 * Create a new Injective namespace for an ERC20 token
 *
 * @param config - Namespace configuration
 * @returns Transaction hash
 */
export async function createNamespace(
  config: NamespaceConfig
): Promise<string> {
  // Validate fiatTokenProxyAddress is a valid EVM address
  validateEvmAddress(config.fiatTokenProxyAddress, "fiatTokenProxyAddress");

  //
  const policyAdmin = config.policyAdmin;
  const contractHookAdmin = config.contractHookAdmin;
  const rolePermissionsAdmin = config.rolePermissionsAdmin;
  const roleManagersAdmin = config.roleManagersAdmin;
  validateInjectiveAddress(policyAdmin, "policyAdmin");
  validateInjectiveAddress(contractHookAdmin, "contractHookAdmin");
  validateInjectiveAddress(rolePermissionsAdmin, "rolePermissionsAdmin");
  validateInjectiveAddress(roleManagersAdmin, "roleManagersAdmin");

  // Validate private key format
  validatePrivateKey(config.signerPrivateKey, "signerPrivateKey");

  const network = config.network || Network.Local;

  // The denom format is "erc20:<EVM_ADDRESS>"
  // For ERC20 tokens, contractHook must be empty string
  const denom = getErc20Denom(config.fiatTokenProxyAddress);

  // Get signer's Injective address
  const signerKey = PrivateKey.fromHex(
    normalizePrivateKey(config.signerPrivateKey)
  );
  const signerAddress = signerKey.toBech32();

  // Build actorRoles - map each role to its actor (using converted Injective addresses)
  const actorRoles = [
    { actor: policyAdmin, roles: ["policyAdmin"] },
    { actor: contractHookAdmin, roles: ["contractHookAdmin"] },
    { actor: rolePermissionsAdmin, roles: ["rolePermissionsAdmin"] },
    { actor: roleManagersAdmin, roles: ["roleManagersAdmin"] },
  ];

  // Create namespace configuration
  const namespace = {
    denom: denom,
    wasmHook: "", // Empty for ERC20 tokens (was contractHook in SDK)
    evmHook: config.fiatTokenProxyAddress,
    rolePermissions: [
      { name: "EVERYONE", roleId: 0, permissions: PERMISSIONS.EVERYONE },
      {
        name: "policyAdmin",
        roleId: 1,
        permissions: PERMISSIONS.MODIFY_POLICY_MANAGERS,
      },
      {
        name: "contractHookAdmin",
        roleId: 2,
        permissions: PERMISSIONS.MODIFY_CONTRACT_HOOK,
      },
      {
        name: "rolePermissionsAdmin",
        roleId: 3,
        permissions: PERMISSIONS.MODIFY_ROLE_PERMISSIONS,
      },
      {
        name: "roleManagersAdmin",
        roleId: 4,
        permissions: PERMISSIONS.MODIFY_ROLE_MANAGERS,
      },
    ],
    actorRoles: actorRoles,
    roleManagers: [
      {
        manager: roleManagersAdmin,
        roles: [
          "EVERYONE",
          "policyAdmin",
          "contractHookAdmin",
          "rolePermissionsAdmin",
          "roleManagersAdmin",
        ],
      },
    ],
    policyStatuses: [],
    policyManagerCapabilities: [],
  };

  // Create the MsgCreateNamespace message
  const msg = MsgCreateNamespace.create({
    sender: signerAddress,
    namespace: namespace,
  });

  // Broadcast transaction
  const endpoints = getNetworkEndpoints(network);

  if (config.useRestApi) {
    // Use custom REST API implementation
    return await broadcastTxViaRestApi(msg, signerKey, endpoints.rest);
  } else {
    // Use gRPC SDK broadcaster
    const broadcaster = new MsgBroadcasterWithPk({
      privateKey: normalizePrivateKey(config.signerPrivateKey),
      network: network,
      endpoints: endpoints,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await broadcaster.broadcast({ msgs: [msg as any] });

    if (response.code !== 0) {
      throw new Error(`Failed to create namespace: ${response.rawLog}`);
    }

    return response.txHash;
  }
}

/**
 * Broadcast transaction via REST API
 *
 * @param msg - The MsgCreateNamespace message
 * @param signerKey - Signer's private key
 * @param restEndpoint - REST API endpoint
 * @param network - Injective network
 * @returns Transaction hash
 */
async function broadcastTxViaRestApi(
  msg: InstanceType<typeof MsgCreateNamespace>,
  signerKey: PrivateKey,
  restEndpoint: string
): Promise<string> {
  const signerAddress = signerKey.toBech32();

  // Fetch account details from REST API
  const accountUrl = `${restEndpoint}/cosmos/auth/v1beta1/accounts/${signerAddress}`;
  const accountResponse = await fetch(accountUrl);

  if (!accountResponse.ok) {
    throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
  }

  const accountData = await accountResponse.json();

  // Handle different account response formats
  const account = accountData.account.base_account || accountData.account;
  const accountNumber = parseInt(account.account_number, 10);
  const sequence = parseInt(account.sequence, 10);
  const pubKey = account.pub_key?.key || signerKey.toPublicKey().toBase64();

  // Fetch chain ID
  const chainInfoUrl = `${restEndpoint}/cosmos/base/tendermint/v1beta1/node_info`;
  const chainInfoResponse = await fetch(chainInfoUrl);

  if (!chainInfoResponse.ok) {
    throw new Error(
      `Failed to fetch chain info: ${chainInfoResponse.statusText}`
    );
  }

  const chainInfo = await chainInfoResponse.json();
  const chainId = chainInfo.default_node_info.network;

  // Create transaction using SDK's createTransaction
  const { txRaw, signBytes } = createTransaction({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: msg as any,
    memo: "",
    fee: {
      amount: [{ denom: "inj", amount: "1000000000000000" }], // 0.001 INJ
      gas: "1000000", // Increased gas limit for namespace creation with EVM hook
    },
    pubKey: pubKey,
    sequence: sequence,
    accountNumber: accountNumber,
    chainId: chainId,
  });

  // Sign the transaction
  const signature = await signerKey.sign(new Uint8Array(signBytes));
  txRaw.signatures = [signature];

  // Broadcast via REST API
  const txRestApi = new TxRestApi(restEndpoint);
  const response = await txRestApi.broadcast(txRaw);

  if (response.code !== 0) {
    throw new Error(`Failed to create namespace: ${response.rawLog}`);
  }

  return response.txHash;
}

/**
 * Query Injective namespace by denom
 *
 * @param fiatTokenProxyAddress - Fiat token proxy EVM address (0x...)
 * @param network - Injective network (default: Local)
 * @param useRestApi - Use REST API instead of gRPC (default: false)
 * @returns Namespace configuration
 */
export async function queryNamespace(
  fiatTokenProxyAddress: string,
  network: Network = Network.Local,
  useRestApi = false
): Promise<NamespaceResponse> {
  // Validate fiatTokenProxyAddress is a valid EVM address
  validateEvmAddress(fiatTokenProxyAddress, "fiatTokenProxyAddress");

  const denom = getErc20Denom(fiatTokenProxyAddress);
  const endpoints = getNetworkEndpoints(network);

  if (useRestApi) {
    // Query via REST API to get evmHook field
    const url = `${endpoints.rest}/injective/permissions/v1beta1/namespace/${encodeURIComponent(denom)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to query namespace: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.namespace) {
      throw new Error(`Namespace not found for denom: ${denom}`);
    }

    // REST API returns snake_case JSON, convert to NamespaceResponse
    const ns = data.namespace;
    return {
      denom: ns.denom,
      contractHook: ns.contract_hook || ns.wasm_hook || "",
      evmHook: ns.evm_hook || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rolePermissions: (ns.role_permissions || []).map((r: any) => ({
        roleId: r.role_id,
        name: r.name,
        permissions: r.permissions,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actorRoles: (ns.actor_roles || []).map((ar: any) => ({
        actor: ar.actor,
        roles: ar.roles,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      roleManagers: (ns.role_managers || []).map((rm: any) => ({
        manager: rm.manager,
        roles: rm.roles,
      })),
    } as NamespaceResponse;
  } else {
    // Use gRPC API (default)
    const chainGrpcPermissionsApi = new ChainGrpcPermissionsApi(endpoints.grpc);

    const namespace = await chainGrpcPermissionsApi.fetchNamespace(denom);
    if (!namespace) {
      throw new Error(`Namespace not found for denom: ${denom}`);
    }
    return namespace as NamespaceResponse;
  }
}

/**
 * Prepare unsigned MsgUpdateActorRoles message for namespace actor rotation
 *
 * @param fiatTokenProxyAddress - Fiat token proxy EVM address (0x...)
 * @param senderAddress - Sender's Injective address (role manager admin)
 * @param newAdmins - Object with optional new admin addresses for each role (EVM format)
 * @param network - Injective network (default: Local)
 * @returns MsgUpdateActorRoles instance with role changes
 */
export async function prepareUpdateActorRolesMessage(
  fiatTokenProxyAddress: string,
  senderAddress: string,
  newAdmins: {
    policyAdmin?: string;
    contractHookAdmin?: string;
    rolePermissionsAdmin?: string;
  },
  network: Network = Network.Local
): Promise<{
  msg: MsgUpdateActorRoles;
  denom: string;
  senderAddress: string;
}> {
  // Validate fiatTokenProxyAddress is a valid EVM address
  validateEvmAddress(fiatTokenProxyAddress, "fiatTokenProxyAddress");

  // Validate sender address
  validateInjectiveAddress(senderAddress, "senderAddress");

  const policyAdmin = newAdmins.policyAdmin;
  const contractHookAdmin = newAdmins.contractHookAdmin;
  const rolePermissionsAdmin = newAdmins.rolePermissionsAdmin;
  if (policyAdmin) {
    validateInjectiveAddress(policyAdmin, "policyAdmin");
  }
  if (contractHookAdmin) {
    validateInjectiveAddress(contractHookAdmin, "contractHookAdmin");
  }
  if (rolePermissionsAdmin) {
    validateInjectiveAddress(rolePermissionsAdmin, "rolePermissionsAdmin");
  }

  const denom = getErc20Denom(fiatTokenProxyAddress);

  // Get current namespace to determine which actors to revoke
  const currentNamespace = await queryNamespace(
    fiatTokenProxyAddress,
    network,
    true
  );

  // Build roleActorsToAdd and roleActorsToRevoke arrays
  // Format: { role: string, actors: string[] }
  const roleActorsToAdd: Array<{ role: string; actors: string[] }> = [];
  const roleActorsToRevoke: Array<{ role: string; actors: string[] }> = [];

  // Helper to process each admin role (now using converted Injective addresses)
  const processRole = (roleName: string, newAddress?: string) => {
    if (!newAddress) return;

    // Find current actor(s) with this role
    const currentActors = currentNamespace.actorRoles
      .filter((ar) => ar.roles.includes(roleName))
      .map((ar) => ar.actor);

    // Revoke role from current actors if any
    if (currentActors.length > 0) {
      roleActorsToRevoke.push({
        role: roleName,
        actors: currentActors,
      });
    }

    // Add role to new actor
    roleActorsToAdd.push({
      role: roleName,
      actors: [newAddress],
    });
  };

  // Process each admin role if provided (using converted addresses)
  // Note: roleManagersAdmin cannot be rotated through this function
  processRole("policyAdmin", policyAdmin);
  processRole("contractHookAdmin", contractHookAdmin);
  processRole("rolePermissionsAdmin", rolePermissionsAdmin);

  // Create MsgUpdateActorRoles using the SDK
  const msg = MsgUpdateActorRoles.fromJSON({
    sender: senderAddress,
    denom: denom,
    roleActorsToAdd: roleActorsToAdd,
    roleActorsToRevoke: roleActorsToRevoke,
  });

  return {
    msg,
    denom,
    senderAddress,
  };
}

/**
 * Update namespace actors (admin roles) by rotating to new addresses
 *
 * Note: This function does NOT support rotating roleManagersAdmin.
 * Role managers must be rotated through a different process.
 *
 * @param fiatTokenProxyAddress - Fiat token proxy EVM address (0x...)
 * @param newAdmins - Object with optional new admin addresses for each role (EVM format)
 * @param signerPrivateKey - Private key of an account with roleManagersAdmin permission
 * @param network - Injective network (default: Local)
 * @returns Transaction hash
 */
export async function updateNamespaceActors(
  fiatTokenProxyAddress: string,
  newAdmins: {
    policyAdmin?: string;
    contractHookAdmin?: string;
    rolePermissionsAdmin?: string;
  },
  signerPrivateKey: string,
  network: Network = Network.Local
): Promise<string> {
  // Validate private key format
  validatePrivateKey(signerPrivateKey, "signerPrivateKey");

  // Get signer's EVM address from private key
  const signerInjectiveAddress =
    getInjectiveAddressFromPrivateKey(signerPrivateKey);

  // Prepare the message using the new function
  const { msg } = await prepareUpdateActorRolesMessage(
    fiatTokenProxyAddress,
    signerInjectiveAddress,
    newAdmins,
    network
  );

  // Broadcast transaction
  const endpoints = getNetworkEndpoints(network);
  const broadcaster = new MsgBroadcasterWithPk({
    privateKey: normalizePrivateKey(signerPrivateKey),
    network: network,
    endpoints: endpoints,
  });

  const response = await broadcaster.broadcast({ msgs: [msg] });

  if (response.code !== 0) {
    throw new Error(`Failed to update namespace actors: ${response.rawLog}`);
  }

  return response.txHash;
}
