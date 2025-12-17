import { expect } from "chai";

describe("basic integration sanity", function () {
  it("runs in the test environment", async function () {
    // This test does not deploy real contracts. It only verifies that
    // the integration test suite is wired correctly.
    const network = process.env.HARDHAT_NETWORK || "unknown";
    expect(network).to.be.a("string");
  });
});
