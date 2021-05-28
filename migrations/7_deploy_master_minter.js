const MasterMinter = artifacts.require("./MasterMinter.sol");
const FiatToken = artifacts.require("./FiatTokenProxy.sol");
let minterOwner;
let fiatToken;

module.exports = function (deployer, network) {
  if (network === "development" || network === "coverage") {
    // Change these if deploying for real, these are deterministic
    // address from ganache
    minterOwner = "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9";
    fiatToken = FiatToken.address;
  }
  console.log("deploying MasterMinter for fiat token at " + fiatToken);
  deployer
    .deploy(MasterMinter, fiatToken)
    .then(function (mm) {
      console.log("master minter deployed at " + mm.address);
      console.log("reassigning owner to " + minterOwner);
      return mm.transferOwnership(minterOwner);
    })
    .then(function () {
      console.log("All done.");
    });
};
