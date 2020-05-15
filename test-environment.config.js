module.exports = {
  accounts: {
    amount: 15,
    ether: 1000000,
  },

  contracts: {
    type: "truffle",
    defaultGas: 6e6,
    defaultGasPrice: 20e9,
    artifactsDir: "build/contracts",
  },

  node: {
    allowUnlimitedContractSize: false,
    gasLimit: 8e6,
    gasPrice: 20e9,
  },
};
