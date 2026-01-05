/* eslint-disable no-console */
import { ethers } from "hardhat";

/**
 * Verifies that proxy admin and token owner addresses match expected values.
 *
 * Usage: npx hardhat run scripts/verify_admins.ts --network sepolia
 */
async function main() {
  const proxyAddress = process.env.FIAT_TOKEN_PROXY_ADDRESS!;
  const expectedProxyAdmin = process.env.PROXY_ADMIN_EXPECTED!;
  const expectedOwner = process.env.OWNER_EXPECTED!;

  const proxy = await ethers.getContractAt("FiatTokenProxy", proxyAddress);
  const proxyAdmin = await proxy.admin();
  const implementation = await proxy.implementation();
  const implementationContract = await ethers.getContractAt("FiatTokenV2_2", implementation);
  const owner = await implementationContract.owner();

  console.log(`Proxy admin: ${proxyAdmin}`);
  console.log(`Owner:       ${owner}`);

  if (proxyAdmin.toLowerCase() !== expectedProxyAdmin.toLowerCase()) {
    console.error("Proxy admin does not match expected!");
  }
  if (owner.toLowerCase() !== expectedOwner.toLowerCase()) {
    console.error("Owner does not match expected!");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
