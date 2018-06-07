module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    // network to refer to ganache by name so it works with truffle/ganache in separate docker containers
    localTestNet: {
      host: "ganache",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};

/*require('babel-register');
require('babel-polyfill');
require('babel-register')({
 ignore: /node_modules\/(?!zeppelin-solidity)/
});*/
