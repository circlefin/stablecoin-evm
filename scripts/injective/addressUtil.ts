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

import {
  Address,
  PrivateKey,
  getInjectiveAddress,
} from "@injectivelabs/sdk-ts";
import { ethers } from "ethers";

/**
 * Validate if a string is a valid EVM address
 *
 * @param address - Address to validate
 * @returns true if valid EVM address, false otherwise
 */
export function isValidEvmAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Validate if a string is a valid Injective address
 * Uses Injective SDK's Address.fromBech32 for proper encoding validation
 *
 * @param address - Address to validate
 * @returns true if valid Injective address, false otherwise
 */
export function isValidInjectiveAddress(address: string): boolean {
  try {
    Address.fromBech32(address, "inj");
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid private key
 * Uses Injective SDK's PrivateKey.fromHex for proper encoding validation
 *
 * @param privateKey - Private key to validate
 * @returns true if valid private key format, false otherwise
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    PrivateKey.fromHex(privateKey.replace("0x", ""));
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert an EVM address to Injective format
 * Only accepts valid EVM addresses (0x...)
 *
 * @param address - EVM address (0x...)
 * @param paramName - Parameter name for error messages
 * @returns Injective address (inj1...)
 * @throws Error if address is not a valid EVM address
 */
export function toInjectiveAddress(address: string, paramName: string): string {
  if (!isValidEvmAddress(address)) {
    throw new Error(
      `Invalid EVM address for ${paramName}: ${address}. Must be a valid Ethereum address (0x...)`
    );
  }

  // Convert EVM address to Injective address
  return getInjectiveAddress(address);
}

/**
 * Get EVM address from a private key
 *
 * @param privateKey - Private key (with or without 0x prefix)
 * @returns EVM address (0x...)
 * @throws Error if private key is invalid
 */
export function getEvmAddressFromPrivateKey(privateKey: string): string {
  if (!isValidPrivateKey(privateKey)) {
    throw new Error(
      `Invalid private key format: ${privateKey}. Must be 64 hex characters with optional 0x prefix`
    );
  }

  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Validate an EVM address and throw if invalid
 *
 * @param address - EVM address to validate
 * @param paramName - Parameter name for error messages
 * @throws Error if address is not a valid EVM address
 */
export function validateEvmAddress(address: string, paramName: string): void {
  if (!isValidEvmAddress(address)) {
    throw new Error(`Invalid EVM address for ${paramName}: ${address}`);
  }
}

/**
 * Validate a private key and throw if invalid
 *
 * @param privateKey - Private key to validate
 * @param paramName - Parameter name for error messages
 * @throws Error if private key is invalid
 */
export function validatePrivateKey(
  privateKey: string,
  paramName: string
): void {
  if (!isValidPrivateKey(privateKey)) {
    throw new Error(
      `Invalid private key format for ${paramName}: ${privateKey}`
    );
  }
}

/**
 * Normalize private key by removing 0x prefix if present
 *
 * @param privateKey - Private key (with or without 0x prefix)
 * @returns Private key without 0x prefix
 */
export function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace("0x", "");
}
