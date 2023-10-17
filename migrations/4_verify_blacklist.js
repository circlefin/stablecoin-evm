/*
 * Use this script to verify that the proxy contract has all items it should blacklist
 *  Make sure your config.js file has the PROXY_CONTRACT_ADDRESS set and the
 *  blacklist.txt file filled.
 *
 * The script is read-only
 */

const fs = require("fs");
const path = require("path");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");

let proxyContractAddress = "";

const configFile = "config.js";
const configFileResolved = path.join(__dirname, "..", configFile);
const blacklistFile = "blacklist.txt";
const blacklistFileResolved = path.join(__dirname, "..", blacklistFile);

// Attempt to fetch the values needed for blacklisting.
if (fs.existsSync(configFileResolved)) {
  ({
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require(`../${configFile}`));
}

if (!proxyContractAddress) {
  throw new Error(
    "PROXY_CONTRACT_ADDRESS must be provided in config.js to validate blacklisting!"
  );
}

// Proceed to blacklist if and only if the file exists.
if (!fs.existsSync(blacklistFileResolved)) {
  throw new Error(
    `${blacklistFile} file does not exist with addresses! See ${blacklistFile}.example!`
  );
}

const addressesToBlacklist = fs
  .readFileSync(blacklistFileResolved, "utf-8")
  .split(/\r?\n/); // Split by newlines (\n)

// Prints out current roles on important contracts, for validation
module.exports = async function (_) {
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;
  const proxyAsV2_1 = await FiatTokenV2_1.at(proxyContractAddress);
  const blacklisterRole = await proxyAsV2_1.blacklister();

  console.log(`>>>>>>> Starting Validation <<<<<<<`);
  console.log(`Proxy Contract Addr:   ${proxyContractAddress}`);
  console.log(`Blacklister Role:   ${blacklisterRole}`);
  console.log(
    `# of items in blacklist.txt:   ${addressesToBlacklist.length}\n\n`
  );

  if (!(await proxyAsV2_1.isBlacklisted(proxyContractAddress))) {
    throw new Error(
      `Proxy Contract @ ${proxyContractAddress} should be blacklisted but is not.`
    );
  }

  let success = 0;
  for (const addr of addressesToBlacklist) {
    if (!(await proxyAsV2_1.isBlacklisted(addr))) {
      throw new Error(`Address: ${addr} is missing from the blacklist.`);
    } else {
      success += 1;
    }
    process.stdout.write(`- ${addr} ... blacklisted`); // Just to show activity
  }
  console.log(`Validated ${success} addresses. No missing addresses found.`);
};
