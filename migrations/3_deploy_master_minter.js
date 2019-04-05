var MasterMinter = artifacts.require('./MasterMinter.sol');

module.exports = function(deployer, network, accounts) {

    var minterOwner = '0x496aacE5EEF1f4f505B67Af45de6Ba992785c124';
    var fiatToken = '0x07865c6e87b9f70255377e024ace6630c1eaa37f';

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