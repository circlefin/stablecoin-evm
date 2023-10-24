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

const fs = require("fs");
const path = require("path");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const MasterMinter = artifacts.require("MasterMinter.sol");

let coldBlacklisterAddress = "";
let coldMasterMinterAddress = "";
let coldOwnerAddress = "";
let coldProxyAdminAddress = "";

let masterMinterContractAddress = "";
let proxyContractAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    COLD_BLACKLISTER_ADDRESS: coldBlacklisterAddress,
    COLD_MASTERMINTER_OWNER_ADDRESS: coldMasterMinterAddress,
    COLD_OWNER_ADDRESS: coldOwnerAddress,
    COLD_PROXY_ADMIN_ADDRESS: coldProxyAdminAddress,
    MASTER_MINTER_CONTRACT_ADDRESS: masterMinterContractAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../../config.js"));
}

// reassign ownership/control of contract to cold storage keys
module.exports = async function (_) {
  if (
    !coldBlacklisterAddress ||
    !coldMasterMinterAddress ||
    !coldOwnerAddress ||
    !coldProxyAdminAddress
  ) {
    throw new Error(
      "COLD_BLACKLISTER_ADDRESS, COLD_MASTERMINTER_ADDRESS, COLD_OWNER_ADDRESS, and COLD_PROXY_ADMIN_ADDRESS must be provided in config.js"
    );
  }

  // Hot private keys used for reassignment.
  console.log(`>>>>>>> Reassigning ownership to cold storage <<<<<<<`);

  masterMinterContractAddress =
    masterMinterContractAddress || (await MasterMinter.deployed()).address;
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  const proxy = await FiatTokenProxy.at(proxyContractAddress);
  const proxyAsV2_2 = await FiatTokenV2_2.at(proxyContractAddress);
  const masterMinter = await MasterMinter.at(masterMinterContractAddress);

  const proxyAdminAddress = await proxy.admin();
  const masterMinterOwnerAddress = await masterMinter.owner();
  const ownerAddress = await proxyAsV2_2.owner();

  // Migrate master minter on token to master minter contract.
  await proxyAsV2_2.updateMasterMinter(masterMinterContractAddress, {
    from: ownerAddress,
  });
  console.log(
    `Reassigned token master minter to the master minter contract ${masterMinterContractAddress}.`
  );

  // Reassign master minter contract's owner to cold owner.
  await masterMinter.transferOwnership(coldMasterMinterAddress, {
    from: masterMinterOwnerAddress,
  });
  console.log(
    `Reassigned master minter contract owner to cold owner ${coldMasterMinterAddress}.`
  );

  // Reassign proxy admin to cold storage.
  const proxyContract = await FiatTokenProxy.at(proxyContractAddress);
  await proxyContract.changeAdmin(coldProxyAdminAddress, {
    from: proxyAdminAddress,
  });
  console.log(
    `Reassigned proxy contract admin to cold admin ${coldProxyAdminAddress}.`
  );

  // Reassign the blacklister, assuming blacklist seeding is complete.
  // Blacklistable.sol#updateBlacklister onlyOwner
  // We must do this while we have the hot owner key before we reassign the token owner below.
  await proxyAsV2_2.updateBlacklister(coldBlacklisterAddress, {
    from: ownerAddress,
  });
  console.log(
    `Reassigned token blacklister to cold blacklister ${coldBlacklisterAddress}.`
  );

  // Reassign the token owner.
  await proxyAsV2_2.transferOwnership(coldOwnerAddress, {
    from: ownerAddress,
  });
  console.log(
    `Reassigned token owner to cold storage owner ${coldOwnerAddress}.`
  );
};
