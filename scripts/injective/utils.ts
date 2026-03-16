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

import { Network } from "@injectivelabs/networks";

// Color codes for output
export const colors = {
  reset: "\x1b[0m",
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  cyan: "\x1b[0;36m",
  blue: "\x1b[0;34m",
  magenta: "\x1b[0;35m",
};

export function printInfo(message: string): void {
  console.log(`${colors.green}[INFO]${colors.reset} ${message}`);
}

export function printError(message: string): void {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

export function printStep(message: string): void {
  console.log(`\n${colors.cyan}[STEP]${colors.reset} ${message}`);
}

export function getNetwork(network: string): Network {
  const networkMap: Record<string, Network> = {
    local: Network.Local,
    testnet: Network.Testnet,
    mainnet: Network.Mainnet,
  };
  return networkMap[network];
}

export function parseNetworkArgs(args: string[]): Network {
  let networkStr: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--network=")) {
      networkStr = arg.split("=")[1]?.toLowerCase();
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  const validNetworks = ["local", "testnet", "mainnet"];
  if (!networkStr || !validNetworks.includes(networkStr)) {
    console.error(`Invalid or missing network: ${networkStr}`);
    process.exit(1);
  }

  return getNetwork(networkStr);
}

export function validateEnvVariables(expectedVars: string[]): void {
  const missingVars: string[] = [];
  for (const varName of expectedVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    printError("Missing required environment variables:");
    missingVars.forEach((v) => console.log(`  - ${v}`));
    console.log(
      "\nPlease set these variables in your .env file (see .env.example)"
    );
    process.exit(1);
  }
}
