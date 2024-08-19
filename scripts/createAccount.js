/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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

const bip39 = require("bip39");
const etherHDkey = require("ethereumjs-wallet/hdkey");

async function createAccount() {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const HDwallet = etherHDkey.fromMasterSeed(seed);
  const zeroWallet = HDwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
  const address = zeroWallet.getAddressString();
  const privateKey = zeroWallet.getPrivateKeyString();

  console.log(`Mnemonic: ${mnemonic}`);
  console.log(`Address: ${address}`);
  console.log(`Private Key: ${privateKey}`);

  return [address, privateKey];
}

module.exports = createAccount;
module.exports.createAccount = createAccount;
