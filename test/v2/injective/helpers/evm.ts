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

import { ethers } from "ethers";
import { PrivateKey } from "@injectivelabs/sdk-ts";
import signatureCheckerArtifact from "../../../../artifacts/hardhat/contracts/util/SignatureChecker.sol/SignatureChecker.json";
import fiatTokenInjectiveArtifact from "../../../../artifacts/hardhat/contracts/v2/injective/FiatTokenInjectiveV2_2.sol/FiatTokenInjectiveV2_2.json";
import fiatTokenProxyArtifact from "../../../../artifacts/hardhat/contracts/v1/FiatTokenProxy.sol/FiatTokenProxy.json";
import { fundAccount } from "./faucet";

const EVM_RPC_ENDPOINT =
  process.env.INJECTIVE_EVM_RPC_ENDPOINT || "http://localhost:8545";

let provider: ethers.JsonRpcProvider | null = null;

export function getJsonRpcProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(EVM_RPC_ENDPOINT);
  }
  return provider;
}

export function getEvmWalletFromPrivateKey(privateKey: string): ethers.Wallet {
  return new ethers.Wallet(privateKey, getJsonRpcProvider());
}

/**
 * ethers.js-compatible interface for FiatTokenInjectiveV2_2
 *
 * TypeChain generates Truffle types (FiatTokenInjectiveV2_2Instance) which use web3.js,
 * but we're using ethers.js for Injective integration tests.
 * This interface provides ethers.js-compatible method signatures matching the contract ABI.
 */
export interface FiatTokenInjectiveV2_2Contract {
  initialize(params: {
    tokenName: string;
    tokenSymbol: string;
    tokenCurrency: string;
    tokenDecimals: number;
    newMasterMinter: string;
    newPauser: string;
    newBlacklister: string;
    newOwner: string;
    accountsToBlacklist: string[];
  }): Promise<ethers.ContractTransactionResponse>;
  initializeInjV2_2(): Promise<ethers.ContractTransactionResponse>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: string): Promise<bigint>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<bigint>;
  owner(): Promise<string>;
}

/**
 * Manually link SignatureChecker library into FiatToken bytecode since
 * we cannot use Hardhat for Injective integration tests.
 */
function linkLibrary(bytecode: string, libraryAddress: string): string {
  const libraryName = "contracts/util/SignatureChecker.sol:SignatureChecker";
  const placeholder = `__$${ethers
    .keccak256(ethers.toUtf8Bytes(libraryName))
    .slice(2, 36)}$__`;
  const formattedAddress = libraryAddress.slice(2).toLowerCase();
  return bytecode.split(placeholder).join(formattedAddress);
}

export function teardownEvmClient(): void {
  if (provider) {
    provider.destroy();
    provider = null;
  }
}

/**
 * Complete deployment setup for FiatTokenInjectiveV2_2 tests that mimics the
 * actual deployment process.
 *
 * @returns All deployment artifacts needed for testing FiatTokenInjectiveV2_2
 */
export async function setupFiatTokenInjectiveV2_2(): Promise<{
  fiatToken: FiatTokenInjectiveV2_2Contract;
  proxyAddress: string;
  deployerEvmAddress: string;
  deployerPrivateKey: string;
  proxyAdminAddress: string;
  proxyAdminPrivateKey: string;
}> {
  // Step 1: Generate private keys for deployer and proxy admin
  const deployerKey = PrivateKey.generate().privateKey;
  const proxyAdminKey = PrivateKey.generate().privateKey;

  const deployerInjectiveAddress = deployerKey.toBech32();
  const proxyAdminInjectiveAddress = proxyAdminKey.toBech32();

  // Step 2: Fund both accounts with INJ for gas
  await fundAccount(deployerInjectiveAddress);
  await fundAccount(proxyAdminInjectiveAddress);

  // Step 3: Get EVM addresses from private keys
  const deployerPrivateKey = deployerKey.toPrivateKeyHex();
  const deployerWallet = getEvmWalletFromPrivateKey(deployerPrivateKey);
  const deployerEvmAddress = deployerWallet.address;

  const proxyAdminPrivateKey = proxyAdminKey.toPrivateKeyHex();
  const proxyAdminWallet = getEvmWalletFromPrivateKey(proxyAdminPrivateKey);
  const proxyAdminAddress = proxyAdminWallet.address;

  // Step 4: Deploy SignatureChecker library
  const SignatureCheckerFactory = new ethers.ContractFactory(
    signatureCheckerArtifact.abi,
    signatureCheckerArtifact.bytecode,
    deployerWallet
  );
  const signatureChecker = await SignatureCheckerFactory.deploy();
  await signatureChecker.waitForDeployment();
  const signatureCheckerAddress = await signatureChecker.getAddress();

  // Step 5: Deploy FiatTokenInjectiveV2_2 implementation with linked library
  const linkedBytecode = linkLibrary(
    fiatTokenInjectiveArtifact.bytecode,
    signatureCheckerAddress
  );
  const ImplementationFactory = new ethers.ContractFactory(
    fiatTokenInjectiveArtifact.abi,
    linkedBytecode,
    deployerWallet
  );
  const implementation = await ImplementationFactory.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();

  // Step 6: Deploy FiatTokenProxy pointing to implementation
  const ProxyFactory = new ethers.ContractFactory(
    fiatTokenProxyArtifact.abi,
    fiatTokenProxyArtifact.bytecode,
    deployerWallet
  );
  const proxy = await ProxyFactory.deploy(implementationAddress);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  // Step 7: Change proxy admin (must be done before initialization)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changeAdminTx = await (proxy as any).changeAdmin(proxyAdminAddress);
  await changeAdminTx.wait();

  // Step 8: Initialize through the proxy with USDC configuration
  // Create a typed contract instance pointing to proxy but using implementation ABI
  const fiatToken = new ethers.Contract(
    proxyAddress,
    fiatTokenInjectiveArtifact.abi,
    deployerWallet
  ) as unknown as FiatTokenInjectiveV2_2Contract;

  const initParams = {
    tokenName: "USDC",
    tokenSymbol: "USDC",
    tokenCurrency: "USD",
    tokenDecimals: 6,
    newMasterMinter: deployerEvmAddress,
    newPauser: deployerEvmAddress,
    newBlacklister: deployerEvmAddress,
    newOwner: deployerEvmAddress,
    accountsToBlacklist: [],
  };

  const initTx = await fiatToken.initialize(initParams);
  await initTx.wait();

  // Step 9: Call initializeInjV2_2 to register with Injective bank module
  // This registers the proxy address with the bank module
  const injInitTx = await fiatToken.initializeInjV2_2();
  await injInitTx.wait();

  return {
    fiatToken,
    proxyAddress,
    deployerEvmAddress,
    deployerPrivateKey,
    proxyAdminAddress,
    proxyAdminPrivateKey,
  };
}
