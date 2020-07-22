const EIP712 = artifacts.require("EIP712");
const ECRecover = artifacts.require("ECRecover");

module.exports = async (deployer, _network) => {
  console.log("Deploying Library contracts...");
  await deployer.deploy(ECRecover);
  console.log("Deployed ECRecover at", (await ECRecover.deployed()).address);
  await deployer.link(ECRecover, EIP712);
  await deployer.deploy(EIP712);
  console.log("Deployed EIP712 at", (await EIP712.deployed()).address);
};
