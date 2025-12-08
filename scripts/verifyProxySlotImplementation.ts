import fs from "fs";
import path from "path";
import hre from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";

//! Note: this script checks the implementation address stored in the proxy slot matches the expected
//!  deployed implementation address. This is important to prevent Clandestine Proxy In the Middle of Proxy Attacks.

/** UpgradeabilityProxy contract uses slot different than the standard
 * IMPLEMENTATION_SLOT = 0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3;
 */
const EIP1967_IMPLEMENTATION_SLOT =
  "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";

type InputObject = {
  FiatTokenV2_2: { contractAddress: string };
  FiatTokenProxy: { contractAddress: string };
  rpcUrl: string;
};

async function main(): Promise<void> {
  console.log(
    "\nVerifying FiatTokenProxy implementation slot matches FiatTokenV2_2"
  );

  // Resolve the shared input file used by verifyBridgedTokenBytecode.ts
  const inputPath = path.join(
    __dirname,
    "..",
    "verification_artifacts",
    "input.json"
  );
  if (!fs.existsSync(inputPath)) {
    throw new Error(
      "verification_artifacts/input.json not found. Ensure the file exists."
    );
  }
  // Read and parse the input for contract addresses
  const input = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as InputObject;

  // Configure provider RPC from input.json (with validation)
  try {
    (hre.network.config as HttpNetworkConfig).url = new URL(
      input.rpcUrl
    ).toString();
  } catch {
    throw new Error("Invalid URL in input.json (rpcUrl).");
  }

  // Extract proxy and expected implementation addresses from input
  const proxy = input?.FiatTokenProxy?.contractAddress;
  const impl = input?.FiatTokenV2_2?.contractAddress;
  if (!proxy || !impl) {
    throw new Error(
      "Missing FiatTokenProxy.contractAddress or FiatTokenV2_2.contractAddress in input.json"
    );
  }

  // Read the EIP-1967 implementation slot from the proxy via eth_getStorageAt
  const raw: string = await hre.ethers.provider.send("eth_getStorageAt", [
    proxy,
    EIP1967_IMPLEMENTATION_SLOT,
    "latest",
  ]);

  // The last 20 bytes of the slot contain the implementation address
  const hex = raw.toLowerCase().replace(/^0x/, "");
  const slotImpl = "0x" + hex.slice(-40);

  // Compare the stored implementation with the expected one
  if (slotImpl.toLowerCase() !== impl.toLowerCase()) {
    throw new Error(
      `Proxy implementation slot ${slotImpl} does not match expected ${impl}`
    );
  }

  console.log(
    "\x1b[32m%s\x1b[0m",
    "\nverification complete - proxy implementation slot matches expected implementation."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
