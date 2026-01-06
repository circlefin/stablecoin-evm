/* eslint-disable no-console */
import { ethers } from "hardhat";

/**
 * Verifies that the total supply of the stablecoin equals the expected supply.
 *
 * Set EXPECTED_SUPPLY in your environment before running:
 *   npx hardhat run scripts/verify_total_supply.ts --network localhost
 */

async function main() {
  const expected = process.env.EXPECTED_SUPPLY;
  if (!expected) {
    console.error("Please set EXPECTED_SUPPLY in your environment.");
    process.exit(1);
  }

  const proxy = await ethers.getContractAt("FiatTokenProxy", process.env.FIAT_TOKEN_PROXY_ADDRESS!);
  const implementation = await proxy.implementation();
  const token = await ethers.getContractAt("FiatTokenV2_2", implementation);
  const totalSupply = await token.totalSupply();
  const formatted = ethers.utils.formatUnits(totalSupply, 6);

  console.log(`Total supply on chain: ${formatted}`);
  console.log(`Expected supply:       ${expected}`);

  if (formatted !== expected) {
    console.error("Supply mismatch detected!");
    process.exit(1);
  }
  console.log("Supply matches expected value.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
