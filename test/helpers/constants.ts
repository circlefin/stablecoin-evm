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

import BN from "bn.js";

export const BLOCK_GAS_LIMIT = 30e6;

// Hex values
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const MAX_UINT256_HEX =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const POW_2_255_HEX =
  "0x8000000000000000000000000000000000000000000000000000000000000000";
export const POW_2_255_MINUS1_HEX =
  "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// BigNumber values
export const MAX_UINT256_BN = new BN(MAX_UINT256_HEX.slice(2), 16);
export const POW_2_255_BN = new BN(POW_2_255_HEX.slice(2), 16);
export const POW_2_255_MINUS1_BN = new BN(POW_2_255_MINUS1_HEX.slice(2), 16);

// derived from mnemonic: clarify final village pulse require old seek excite mushroom forest satoshi video
export const ACCOUNTS_AND_KEYS: { address: string; key: string }[] = [
  {
    address: "0x8e81C8f0CFf3d6eA2Fe72c1A5ee49Fc377401c2D",
    key: "84132dd41f32804774a98647c308c0c94a54c0f3931128c0210b6f3689d2b7e7",
  },
  {
    address: "0x244A0A1d21f21167c17e04EBc5FA33c885990674",
    key: "31a372c197c7c5d6856bfac311a66f179bdc3bda20e78030b0fef90e40cbc83f",
  },
  {
    address: "0x6966f881B3Ee9074b0783CC614e3864e380B8b27",
    key: "58bdc54eb2aa3a92e5a36fae01d23b7626fa89116a41e01ca3c6cb18799aee3d",
  },
  {
    address: "0xaC5faE80468DcC49D404d0625609C031B9AF2cb7",
    key: "d14ca7a30bc2921ddb89ea2f6c52393f91e794cd9c3c994f547eb7edeb092fd1",
  },
  {
    address: "0x18C246058e9e4Ae1737387fA90cD69E39f78F73A",
    key: "1c09baae4343b0a66567d56769b62537623389542480f30e9acdae0624612872",
  },
  {
    address: "0xc4dc5dAD36fF9b8cB694E79238ECbe76ab13BcEc",
    key: "2048571627de761088f2f369306f9c231e6c7ab94be1f0a0c979776a2f424328",
  },
  {
    address: "0x75Bf6E76D3dB629f46da549D49C9ea821CE8e9A9",
    key: "9a9afb6a8e2384e4cce14824d15162bba2eed7e31df846ff77d697fed8cba0c1",
  },
  {
    address: "0x55937b3ae7a34F551e5aFa5BA51Fba4eD9f8FeD7",
    key: "9747a0294186b8fef20ec1e4341a10c87840b18a8930b84c4c5dcd97799ba0bc",
  },
  {
    address: "0x1eEEBc3900803a28ca6E68Eb98FDeCf98350D97B",
    key: "cdbaf218f6332bfa630ec2abc7a8bc450b2e8746133d84450dfc2234fdfb83ef",
  },
  {
    address: "0x8719beDE472E67642b88DbA9aD1b1b9dc05CC60e",
    key: "c08dbf2c9aaf5dc3cd5ce5349e754de086202a5f352a512851a4f174ac246198",
  },
  {
    address: "0xE03701ea2248C7ca2Fed1e655ff3C803C7267302",
    key: "40566af8625c93f95c5e1ea9aa42642bcbdd64fe4fe7926283d04173cb842189",
  },
  {
    address: "0x10506aB975D36aa781B77C1Ce204F46e8f87dA57",
    key: "55ef7a25bba3449344d8a1e525ba3ca4999bdc763be4efaf9e94a4de396f8370",
  },
  {
    address: "0xee11cdb1f9eEe2eB40D2CF99b4fa7D782aE582A6",
    key: "985117805090656613ae19743879efe4cff76049de03516debf41926313e3629",
  },
  {
    address: "0xB9203C29E242d7a19AE6970cDf0d873048B99419",
    key: "3a37d1ad3751e697c26dd05a71cd9263c023f3e8a1d1067215044032c62ee916",
  },
  {
    address: "0xcC03603436Bc0Edd1e0661379f3Aa289ae967597",
    key: "db81ac68891890ec33021264ce81f9b5f9296a9fd95cdc785655db3066db2c08",
  },
];

const GANACHE_ACCOUNTS: Array<string> = [
  "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
  "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
  "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d",
  "0xd03ea8624C8C5987235048901fB614fDcA89b117",
  "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC",
  "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
  "0x28a8746e75304c0780E011BEd21C72cD78cd535E",
  "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E",
  "0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e",
  "0x610Bb1573d1046FCb8A70Bbbd395754cD57C2b60",
  "0x855FA758c77D68a04990E992aA4dcdeF899F654A",
  "0xfA2435Eacf10Ca62ae6787ba2fB044f8733Ee843",
  "0x64E078A8Aa15A41B85890265648e965De686bAE6",
  "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598",
];

const GANACHE_PRIVATE_KEYS: Array<string> = [
  "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
  "6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1",
  "6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c",
  "646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913",
  "add53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743",
  "395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd",
  "e485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52",
  "a453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3",
  "829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4",
  "b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773",
  "77c5495fbb039eed474fc940f29955ed0531693cc9212911efd35dff0373153f",
  "d99b5b29e6da2528bf458b26237a6cf8655a3e3276c1cdc0de1f98cefee81c01",
  "9b9c613a36396172eab2d34d72331c8ca83a358781883a535d2941f66db07b24",
  "0874049f95d55fb76916262dc70571701b5c4cc5900c0691af75f1a8a52c8268",
  "21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46",
];

export const accounts = {
  deployerAccount: GANACHE_ACCOUNTS[0],
  arbitraryAccount: GANACHE_ACCOUNTS[1],
  tokenOwnerAccount: GANACHE_ACCOUNTS[3],
  blacklisterAccount: GANACHE_ACCOUNTS[4],
  arbitraryAccount2: GANACHE_ACCOUNTS[5],
  masterMinterAccount: GANACHE_ACCOUNTS[6],
  minterAccount: GANACHE_ACCOUNTS[7],
  pauserAccount: GANACHE_ACCOUNTS[8],
  mintOwnerAccount: GANACHE_ACCOUNTS[9],
  controller1Account: GANACHE_ACCOUNTS[11],
  rescuerAccount: GANACHE_ACCOUNTS[12],
  lostAndFoundAccount: GANACHE_ACCOUNTS[13],
  proxyOwnerAccount: GANACHE_ACCOUNTS[14],
};

export const accountPrivateKeys = {
  deployerAccount: GANACHE_PRIVATE_KEYS[0],
  arbitraryAccount: GANACHE_PRIVATE_KEYS[1],
  tokenOwnerAccount: GANACHE_PRIVATE_KEYS[3],
  blacklisterAccount: GANACHE_PRIVATE_KEYS[4],
  arbitraryAccount2: GANACHE_PRIVATE_KEYS[5],
  masterMinterAccount: GANACHE_PRIVATE_KEYS[6],
  minterAccount: GANACHE_PRIVATE_KEYS[7],
  pauserAccount: GANACHE_PRIVATE_KEYS[8],
  mintOwnerAccount: GANACHE_PRIVATE_KEYS[9],
  controller1Account: GANACHE_PRIVATE_KEYS[11],
  rescuerAccount: GANACHE_PRIVATE_KEYS[12],
  lostAndFoundAccount: GANACHE_PRIVATE_KEYS[13],
  proxyOwnerAccount: GANACHE_PRIVATE_KEYS[14],
};
