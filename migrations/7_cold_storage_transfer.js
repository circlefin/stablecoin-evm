const fs = require("fs");
const path = require("path");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const MasterMinter = artifacts.require("MasterMinter.sol");

let coldBlacklisterAddress = "";
let coldMasterMinterAddress = "";
let coldOwnerAddress = "";
let coldProxyAdminAddress = "";

let masterMinterContractAddress = "";
let proxyContractAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    COLD_BLACKLISTER_ADDRESS: coldBlacklisterAddress,
    COLD_MASTERMINTER_OWNER_ADDRESS: coldMasterMinterAddress,
    COLD_OWNER_ADDRESS: coldOwnerAddress,
    COLD_PROXY_ADMIN_ADDRESS: coldProxyAdminAddress,
    MASTER_MINTER_CONTRACT_ADDRESS: masterMinterContractAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../config.js"));
}

// reassign ownership/control of contract to cold storage keys
module.exports = async function (deployer, network, accounts) {
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
  const masterMinterOwnerAddress = accounts[1];
  const proxyAdminAddress = accounts[2];
  const ownerAddress = accounts[3];

  console.log(`>>>>>>> Reassigning ownership to cold storage <<<<<<<`);

  masterMinterContractAddress =
    masterMinterContractAddress || (await MasterMinter.deployed()).address;
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  // Migrate master minter on token to master minter contract.
  const proxyAsV2_1 = await FiatTokenV2_1.at(proxyContractAddress);
  await proxyAsV2_1.updateMasterMinter(masterMinterContractAddress, {
    from: ownerAddress,
  });
  console.log(
    `Reassigned token master minter to the master minter contract ${masterMinterContractAddress}.`
  );

  // Reassign master minter contract's owner to cold owner.
  const masterMinter = await MasterMinter.at(masterMinterContractAddress);
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
  await proxyAsV2_1.updateBlacklister(coldBlacklisterAddress, {
    from: ownerAddress,
  });
  console.log(
    `Reassigned token blacklister to cold blacklister ${coldBlacklisterAddress}.`
  );

  // Reassign the token owner.
  await proxyAsV2_1.transferOwnership(coldOwnerAddress, {
    from: ownerAddress,
  });
  console.log(
    `Reassigned token owner to cold storage owner ${coldOwnerAddress}.`
  );
};
