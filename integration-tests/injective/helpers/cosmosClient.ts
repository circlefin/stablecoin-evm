/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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

import { StargateClient } from "@cosmjs/stargate";
import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import {
  PrivateKey,
  MsgSend,
  MsgBroadcasterWithPk,
  ChainGrpcBankApi,
  ChainGrpcAuthApi,
} from "@injectivelabs/sdk-ts";

// Injective SDK uses gRPC-web which works on the REST API port
const GRPC_ENDPOINT =
  process.env.INJECTIVE_GRPC_ENDPOINT || "http://localhost:10337";
const TENDERMINT_RPC_ENDPOINT =
  process.env.INJECTIVE_RPC_ENDPOINT || "http://localhost:26657";

let stargateClient: StargateClient | null;
let bankClient: ChainGrpcBankApi | null;
let authClient: ChainGrpcAuthApi | null;

async function getStargateClient(): Promise<StargateClient> {
  if (!stargateClient) {
    stargateClient = await StargateClient.connect(TENDERMINT_RPC_ENDPOINT);
  }
  return stargateClient;
}

function getBankClient(): ChainGrpcBankApi {
  if (!bankClient) {
    bankClient = new ChainGrpcBankApi(GRPC_ENDPOINT);
  }
  return bankClient;
}

function getAuthClient(network: Network = Network.Local): ChainGrpcAuthApi {
  if (!authClient) {
    const endpoints = getNetworkEndpoints(network);
    authClient = new ChainGrpcAuthApi(endpoints.grpc);
  }
  return authClient;
}

export function teardownCosmosClient(): void {
  bankClient = null;
  stargateClient = null;
  authClient = null;
}

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Get the bank module denom for an ERC-20 contract address
 * Injective uses the format: erc20:<contract_address>
 */
export function getErc20Denom(contractAddress: string): string {
  return `erc20:${contractAddress}`;
}

// =============================================================================
// Read operations
// =============================================================================

export async function isNodeReady(): Promise<boolean> {
  try {
    const client = await getStargateClient();
    await client.getChainId();
    return true;
  } catch {
    return false;
  }
}

export async function getBalance(
  address: string,
  denom: string
): Promise<string> {
  const client = getBankClient();
  const balance = await client.fetchBalance({
    accountAddress: address,
    denom,
  });
  return balance.amount;
}

export async function getDenomMetadata(denom: string): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  description: string;
} | null> {
  const client = getBankClient();
  const metadata = await client.fetchDenomMetadata(denom);

  return {
    name: metadata.name,
    symbol: metadata.symbol,
    decimals: metadata.decimals,
    description: metadata.description,
  };
}

export async function getTotalSupply(denom: string): Promise<string> {
  const client = getBankClient();
  const supply = await client.fetchSupplyOf(denom);
  return supply.amount;
}

/**
 * Get the bank module balance for an ERC-20 token
 * @param injectiveAddress Bech32 Injective address (inj1...)
 * @param contractAddress EVM contract address (0x...)
 * @returns The token balance as a string
 */
export async function getErc20Balance(
  injectiveAddress: string,
  contractAddress: string
): Promise<string> {
  const denom = getErc20Denom(contractAddress);
  return getBalance(injectiveAddress, denom);
}

/**
 * Fetch account information from the network using gRPC
 *
 * @param injectiveAddress - Injective address (inj1...)
 * @param network - Injective network (default: Local)
 * @returns Account number and chain ID
 */
export async function fetchAccountInfo(
  injectiveAddress: string,
  network: Network = Network.Local
): Promise<{ accountNumber: number; chainId: string }> {
  const authClient = getAuthClient(network);

  // Create a dedicated StargateClient for this network
  const endpoints = getNetworkEndpoints(network);
  if (!endpoints.rpc) {
    throw new Error(`No RPC endpoint configured for network: ${network}`);
  }
  const networkStargateClient = await StargateClient.connect(endpoints.rpc);

  // Fetch account information using gRPC
  const account = await authClient.fetchAccount(injectiveAddress);

  // Fetch chain ID using StargateClient
  const chainId = await networkStargateClient.getChainId();

  return {
    accountNumber: account.baseAccount.accountNumber,
    chainId,
  };
}

// =============================================================================
// Write operations
// =============================================================================

export async function sendTokens(
  privateKey: PrivateKey,
  recipientAddress: string,
  amount: string,
  denom = "inj"
): Promise<{ code: number; transactionHash: string; rawLog?: string }> {
  const senderAddress = privateKey.toBech32();

  const broadcaster = new MsgBroadcasterWithPk({
    network: Network.Local,
    privateKey,
  });

  const msg = MsgSend.fromJSON({
    amount: { amount, denom },
    srcInjectiveAddress: senderAddress,
    dstInjectiveAddress: recipientAddress,
  });

  const response = await broadcaster.broadcast({ msgs: msg });

  return {
    code: response.code,
    transactionHash: response.txHash,
    rawLog: response.rawLog,
  };
}
