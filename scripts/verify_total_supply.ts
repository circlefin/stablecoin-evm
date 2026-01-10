/* eslint-disable no-console */
import { ethers } from "hardhat";

/**
 * Verify on-chain total supply matches expected supply.
 * Run with: npx hardhat run scripts/verify_total_supply.ts --network <network>
 * Set EXPECTED_SUPPLY in env (e.g. 1000000)
 */

async function main() {
  const expected = process.env.EXPECTED_SUPPLY;
  if (!expected) {
    throw new Error("EXPECTED_SUPPLY env var must be set");
  }
  const proxyAddr = process.env.FIAT_TOKEN_PROXY_ADDRESS!;
  const proxy = await ethers.getContractAt("FiatTokenProxy", proxyAddr);
  const impl = await proxy.implementation();
  const token = await ethers.getContractAt("FiatTokenV2_2", impl);
  const totalSupply = await token.totalSupply();
  const supply = ethers.utils.formatUnits(totalSupply, 6);
  console.log(`On-chain supply: ${supply}`);
  console.log(`Expected supply: ${expected}`);
  if (supply !== expected) {
    throw new Error("Supply mismatch");
  }
  console.log("Supply matches expected.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
