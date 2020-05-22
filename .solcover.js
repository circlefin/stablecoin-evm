module.exports = {
  providerOptions: {
    port: 8555,
    seed: "TestRPC is awesome!",
    total_accounts: 15,
    default_balance_ether: 1000000,
  },
  skipFiles: ["test/"],
  copyPackages: ["openzeppelin-solidity", "zos-lib"],
};
