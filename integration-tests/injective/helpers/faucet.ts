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

import { PrivateKey } from "@injectivelabs/sdk-ts";
import { sendTokens, getBalance } from "./cosmosClient";

// Designate USER10 (signer5) as faucet account
// https://github.com/InjectiveFoundation/injective-core/blob/master/setup.sh
const FAUCET_MNEMONIC =
  process.env.FAUCET_MNEMONIC ||
  "apart acid night more advance december weather expect pause taxi reunion eternal crater crew lady chaos visual dynamic friend match glow flash couple tumble";
const FAUCET_KEY = PrivateKey.fromMnemonic(FAUCET_MNEMONIC);

const INJ_DENOM = "inj";
const DEFAULT_FAUCET_AMOUNT = "100000000000000000000"; // 100 INJ

export async function fundAccount(
  recipientAddress: string,
  amount: string = DEFAULT_FAUCET_AMOUNT
): Promise<{ code: number; transactionHash: string; rawLog?: string }> {
  const result = await sendTokens(
    FAUCET_KEY,
    recipientAddress,
    amount,
    INJ_DENOM
  );

  if (result.code !== 0) {
    throw new Error(
      `Failed to fund account: ${result.rawLog || "Unknown error"}`
    );
  }

  return result;
}

export async function getFaucetBalance(): Promise<string> {
  return getBalance(FAUCET_KEY.toBech32(), INJ_DENOM);
}
