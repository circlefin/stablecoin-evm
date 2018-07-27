module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    // solidity-coverage looks for a network called 'coverage' and makes one
    // identical to this one if it is not found. We want solidity coverage to
    // accept this truffle.js file as valid so it will use our custom reporter,
    // so we add the 'coverage' network manually here.
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 17592186044415,
      gasPrice: 1
    },
    // network to refer to ganache by name so it works with truffle/ganache in separate docker containers
    localTestNet: {
      host: "ganache",
      port: 8545,
      network_id: "*" // Match any network id
    }
  },
  mocha: {
    /*
    * To disable the spreadsheet verification tool ensure that
    * the reporter is set to 'Spec' by commenting/uncommenting the lines below.
    */
    reporter: 'Spec',
    //reporter: './verification/verification_reporter.js',
  },
};
