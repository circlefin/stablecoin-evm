var FiatToken = artifacts.require("./FiatTokenV1.sol");

module.exports = function(deployer, network, accounts) {
  var a = accounts[0];
  var s;
  var ft;
  return deployer.deploy(FiatToken);
};