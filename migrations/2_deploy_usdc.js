var FiatTokenV1 = artifacts.require("./FiatTokenV1.sol");
var FiatTokenProxy = artifacts.require("./FiatTokenProxy.sol");

// Any address will do, preferably one we generated
var throwawayAddress = "0x64e078a8aa15a41b85890265648e965de686bae6";

module.exports = function (deployer, network) {
  if (["development", "coverage", "test"].includes(network)) {
    // Change these to the cold storage addresses provided by ops
    // these are the deterministic addresses from ganache, so the private keys are well known
    // and match the values we use in the tests
    var admin = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    var masterMinter = "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9";
    var pauser = "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E";
    var blacklister = "0xd03ea8624C8C5987235048901fB614fDcA89b117";
    var owner = "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d";
  }

  console.log("deploying impl");

  // deploy implementation contract
  deployer
    .deploy(FiatTokenV1)
    .then(function () {
      return FiatTokenV1.deployed();
    })
    .then(function (fiatTokenV1) {
      console.log("initializing impl with dummy values");
      return fiatTokenV1.initialize(
        "",
        "",
        "",
        0,
        throwawayAddress,
        throwawayAddress,
        throwawayAddress,
        throwawayAddress
      );
    })
    .then(function () {
      console.log("deploying proxy");
      return deployer.deploy(FiatTokenProxy, FiatTokenV1.address);
    })
    .then(function () {
      return FiatTokenProxy.deployed();
    })
    .then(function (fiatTokenProxy) {
      console.log("reassigning proxy admin");
      // need to change admin first, or the call to initialize won't work
      // since admin can only call methods in the proxy, and not forwarded methods
      return fiatTokenProxy.changeAdmin(admin);
    })
    .then(function () {
      return FiatTokenV1.at(FiatTokenProxy.address);
    })
    .then(function (fiatTokenProxyAsFiatTokenV1) {
      console.log("initializing proxy");
      // Pretend that the proxy address is a FiatTokenV1
      // this is fine because the proxy will forward all the calls to the FiatTokenV1 impl
      return fiatTokenProxyAsFiatTokenV1.initialize(
        "USD//C",
        "USDC",
        "USD",
        6,
        masterMinter,
        pauser,
        blacklister,
        owner
      );
    })
    .then(function () {
      console.log("deployed proxy at ", FiatTokenProxy.address);
    });
};
