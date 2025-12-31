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
import { Network } from "@injectivelabs/networks";
import {
  PrivateKey,
  MsgSend,
  MsgBroadcasterWithPk,
  ChainRestBankApi,
} from "@injectivelabs/sdk-ts";

const CHAIN_ID = "injective-1";
const TENDERMINT_RPC_ENDPOINT =
  process.env.INJECTIVE_RPC_ENDPOINT || "http://localhost:26657";
const INJECTIVE_REST_ENDPOINT =
  process.env.INJECTIVE_REST_ENDPOINT || "http://localhost:10337";

let stargateClient: StargateClient | null;
let bankApi: ChainRestBankApi | null;

async function getStargateClient(): Promise<StargateClient> {
  if (!stargateClient) {
    stargateClient = await StargateClient.connect(TENDERMINT_RPC_ENDPOINT);
  }
  return stargateClient;
}

function getBankApi(): ChainRestBankApi {
  if (!bankApi) {
    bankApi = new ChainRestBankApi(INJECTIVE_REST_ENDPOINT);
  }
  return bankApi;
}

export function teardown(): void {
  if (stargateClient) {
    stargateClient.disconnect();
    stargateClient = null;
  }
  bankApi = null;
}

// =============================================================================
// Read-only query functions
// =============================================================================

export async function isNodeReady(): Promise<boolean> {
  try {
    const client = await getStargateClient();
    const chainId = await client.getChainId();
    return chainId === CHAIN_ID;
  } catch {
    return false;
  }
}

export async function getBalance(
  address: string,
  denom: string
): Promise<string> {
  try {
    const response = await getBankApi().fetchBalance(address, denom);
    return response.amount;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("balance was not found")
    ) {
      return "0";
    }
    throw error;
  }
}

// =============================================================================
// Transaction functions
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
