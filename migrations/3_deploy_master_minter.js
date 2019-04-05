var MasterMinter = artifacts.require('./MasterMinter.sol');
var FiatToken = artifacts.require('./FiatTokenProxy.sol')

module.exports = function(deployer, network, accounts) {

    if( network == "development" || network == "coverage") {
        // Change these if deploying for real, these are deterministic
        // address from ganache
        var minterOwner = "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9";
        var fiatToken = FiatToken.address;
    }
    console.log("deploying MasterMinter for fiat token at " + fiatToken);
    deployer.deploy(MasterMinter, fiatToken)
        .then( function(mm) {
            console.log("master minter deployed at " + mm.address)
            console.log("reassigning owner to " + minterOwner);
            return mm.transferOwnership(minterOwner);
        })
        .then(function(ownerTransferred) {
            console.log("All done.")
        });
}