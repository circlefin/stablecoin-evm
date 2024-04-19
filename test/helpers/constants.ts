/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
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

export const HARDHAT_ACCOUNTS: string[] = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
  "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
  "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
  "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
  "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
  "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
  "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
  "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
  "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
  "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
  "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
];

export const HARDHAT_PRIVATE_KEYS: string[] = [
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
  "f214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897",
  "701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82",
  "a267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1",
  "47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd",
  "c526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa",
  "8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61",
  "ea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0",
  "689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd",
  "de9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0",
  "df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e",
];

export const accounts = {
  deployerAccount: HARDHAT_ACCOUNTS[0],
  arbitraryAccount: HARDHAT_ACCOUNTS[1],
  tokenOwnerAccount: HARDHAT_ACCOUNTS[3],
  blacklisterAccount: HARDHAT_ACCOUNTS[4],
  arbitraryAccount2: HARDHAT_ACCOUNTS[5],
  masterMinterAccount: HARDHAT_ACCOUNTS[6],
  minterAccount: HARDHAT_ACCOUNTS[7],
  pauserAccount: HARDHAT_ACCOUNTS[8],
  mintOwnerAccount: HARDHAT_ACCOUNTS[9],
  controller1Account: HARDHAT_ACCOUNTS[11],
  rescuerAccount: HARDHAT_ACCOUNTS[12],
  lostAndFoundAccount: HARDHAT_ACCOUNTS[13],
  proxyOwnerAccount: HARDHAT_ACCOUNTS[14],
};

export const accountPrivateKeys = {
  deployerAccount: HARDHAT_PRIVATE_KEYS[0],
  arbitraryAccount: HARDHAT_PRIVATE_KEYS[1],
  tokenOwnerAccount: HARDHAT_PRIVATE_KEYS[3],
  blacklisterAccount: HARDHAT_PRIVATE_KEYS[4],
  arbitraryAccount2: HARDHAT_PRIVATE_KEYS[5],
  masterMinterAccount: HARDHAT_PRIVATE_KEYS[6],
  minterAccount: HARDHAT_PRIVATE_KEYS[7],
  pauserAccount: HARDHAT_PRIVATE_KEYS[8],
  mintOwnerAccount: HARDHAT_PRIVATE_KEYS[9],
  controller1Account: HARDHAT_PRIVATE_KEYS[11],
  rescuerAccount: HARDHAT_PRIVATE_KEYS[12],
  lostAndFoundAccount: HARDHAT_PRIVATE_KEYS[13],
  proxyOwnerAccount: HARDHAT_PRIVATE_KEYS[14],
};
