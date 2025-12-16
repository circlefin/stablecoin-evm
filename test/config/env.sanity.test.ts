import { expect } from "chai";

describe("env sanity", () => {
  it("does not throw when reading optional env variables", () => {
    const keys = [
      "ETHERSCAN_KEY",
      "RPC_URL",
      "HARDHAT_NETWORK",
      "DEPLOYER_PRIVATE_KEY",
    ];

    const values = keys.map((key) => process.env[key]);
    // The point of this test is simply to ensure access to process.env
    // does not crash the test environment.
    expect(values).to.be.an("array");
  });
});
