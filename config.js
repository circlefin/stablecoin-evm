/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2023, Circle Internet Financial, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
  // Change this to USD on l1
  L1_TOKEN_ADDRESS: "0x7fc98692f26C21D74D358ffe47c84B616db1e68a",
  L2_BRIDGE_ADDRESS: "0x4200000000000000000000000000000000000010",
  // BIP39 mnemonic phrase
  MNEMONIC: "",
  // INFURA API key
  INFURA_KEY: "",
  // FiatTokenProxy admin - can upgrade implementation contract
  PROXY_ADMIN_ADDRESS: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  // Owner - can configure master minter, pauser, and blacklister
  OWNER_ADDRESS: "0x507233c4d0220505d3Ec3Db131eD8D0F8Ae3cD44",
  // Master Minter Owner - owner of master minter contract
  MASTERMINTER_OWNER_ADDRESS: "0x507233c4d0220505d3Ec3Db131eD8D0F8Ae3cD44",
  // Pauser - can pause the contract
  PAUSER_ADDRESS: "0x507233c4d0220505d3Ec3Db131eD8D0F8Ae3cD44",
  // Blacklister - can blacklist addresses
  BLACKLISTER_ADDRESS: "0x507233c4d0220505d3Ec3Db131eD8D0F8Ae3cD44",
  // FiatTokenProxy contract - override the contract address used in migrations
  // PROXY_CONTRACT_ADDRESS: "",
  // FiatToken Implementation contract - deploy new proxy with an existing implementation contract
  // FIAT_TOKEN_IMPLEMENTATION_ADDRESS: "",
  // LostAndFound - tokens that were locked in the contract are sent to this
  LOST_AND_FOUND_ADDRESS: "0x507233c4d0220505d3Ec3Db131eD8D0F8Ae3cD44",
  // MockERC1271WalletOwner - can deploy and send transactions from a sample ERC1271 wallet
  // MOCK_ERC1271_WALLET_OWNER_ADDRESS: "",

  // TokenName - ERC20 name of the token e.g. "USD Coin"
  TOKEN_NAME: "Bridged USDC (RiskHarbor)",
  // TokenSymbol - Symbol of the token e.g. "USDC"
  TOKEN_SYMBOL: "USDC.e",
  // TokenCurrency - Currency of the token e.g. "USD"
  TOKEN_CURRENCY: "USD",
  // TokenDecimals - Number of decimals for the token e.g. 6
  TOKEN_DECIMALS: 6,

  // USE_VERSIONED_MIGRATIONS - whether or not to use migrations in migrations/versioned directory.
  // These migrations deploy each version of FiatToken separately.
  USE_VERSIONED_MIGRATIONS: false,
};
