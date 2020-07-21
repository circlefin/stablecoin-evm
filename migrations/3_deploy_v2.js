const EIP712 = artifacts.require("EIP712");
const ECRecover = artifacts.require("ECRecover");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenUtil = artifacts.require("FiatTokenUtil");
const V2Upgrader = artifacts.require("V2Upgrader");
const V2UpgraderHelper = artifacts.require("V2UpgraderHelper");

const throwawayAddress = "0x0000000000000000000000000000000000000001";

module.exports = async (deployer, _network) => {
  console.log("Deploying Library contracts...");
  await deployer.deploy(ECRecover);
  console.log("Deployed ECRecover at", (await ECRecover.deployed()).address);
  await deployer.link(ECRecover, EIP712);
  await deployer.deploy(EIP712);
  console.log("Deployed EIP712 at", (await EIP712.deployed()).address);

  console.log("Deploying FiatTokenV2 implementation contract...");
  await deployer.link(EIP712, FiatTokenV2);
  await deployer.deploy(FiatTokenV2);

  const fiatTokenV2 = await FiatTokenV2.deployed();
  console.log("Deployed FiatTokenV2 at", fiatTokenV2.address);
  console.log(
    "Initializing FiatTokenV2 implementation contract with dummy values..."
  );
  await fiatTokenV2.initialize(
    "",
    "",
    "",
    0,
    throwawayAddress,
    throwawayAddress,
    throwawayAddress,
    throwawayAddress
  );
  await fiatTokenV2.initializeV2("");

  const fiatTokenProxy = await FiatTokenProxy.deployed();
  console.log("Using FiatTokenProxy address:", fiatTokenProxy.address);

  console.log("Deploying FiatTokenUtil contract...");
  const fiatTokenUtil = await deployer.deploy(
    FiatTokenUtil,
    fiatTokenProxy.address
  );
  console.log("Deployed FiatTokenUtil at", fiatTokenUtil.address);

  console.log("Deploying V2Upgrader contract...");

  const v2UpgraderHelper = await deployer.deploy(
    V2UpgraderHelper,
    fiatTokenProxy.address
  );
  const v2Upgrader = await deployer.deploy(
    V2Upgrader,
    fiatTokenProxy.address,
    fiatTokenV2.address,
    v2UpgraderHelper.address
  );

  console.log(`>>>>>>> Deployed V2Upgrader at ${v2Upgrader.address} <<<<<<<`);
};
