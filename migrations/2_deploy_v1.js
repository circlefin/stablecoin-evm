const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");

const throwawayAddress = "0x0000000000000000000000000000000000000001";

module.exports = async (deployer, network) => {
  let admin, masterMinter, pauser, blacklister, owner;

  if (network.toLowerCase().includes("mainnet")) {
    const {
      ADMIN_ADDRESS,
      MASTERMINTER_ADDRESS,
      PAUSER_ADDRESS,
      BLACKLISTER_ADDRESS,
      OWNER_ADDDRESS,
    } = process.env;

    if (
      !ADMIN_ADDRESS ||
      !MASTERMINTER_ADDRESS ||
      !PAUSER_ADDRESS ||
      !BLACKLISTER_ADDRESS ||
      !OWNER_ADDDRESS
    ) {
      throw new Error(
        "Env vars ADMIN_ADDRESS, MASTERMINTER_ADDRESS, PAUSER_ADDRESS, " +
          "BLACKLISTER_ADDRESS, and OWNER_ADDRESS must be defined for " +
          "mainnet deployment"
      );
    }

    admin = ADMIN_ADDRESS;
    masterMinter = MASTERMINTER_ADDRESS;
    pauser = PAUSER_ADDRESS;
    blacklister = BLACKLISTER_ADDRESS;
    owner = OWNER_ADDDRESS;
  } else {
    // Do not use these addresses for mainnet - these are the deterministic
    // addresses from ganache, so the private keys are well known and match the
    // values we use in the tests
    admin = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    masterMinter = "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9";
    pauser = "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E";
    blacklister = "0xd03ea8624C8C5987235048901fB614fDcA89b117";
    owner = "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d";
  }

  console.log("Deploying implementation contract...");
  await deployer.deploy(FiatTokenV1);
  const fiatTokenV1 = await FiatTokenV1.deployed();
  console.log("Deployed implementation contract at", FiatTokenV1.address);

  console.log("Initializing implementation contract with dummy values...");
  await fiatTokenV1.initialize(
    "",
    "",
    "",
    0,
    throwawayAddress,
    throwawayAddress,
    throwawayAddress,
    throwawayAddress
  );

  console.log("Deploying proxy contract...");
  await deployer.deploy(FiatTokenProxy, FiatTokenV1.address);
  const fiatTokenProxy = await FiatTokenProxy.deployed();
  console.log("Deployed proxy contract at", FiatTokenProxy.address);

  console.log("Reassigning proxy contract admin...");
  // need to change admin first, or the call to initialize won't work
  // since admin can only call methods in the proxy, and not forwarded methods
  await fiatTokenProxy.changeAdmin(admin);

  console.log("Initializing proxy contract...");
  const fiatTokenV1Proxied = await FiatTokenV1.at(FiatTokenProxy.address);
  // Pretend that the proxy address is a FiatTokenV1 - this is fine because the
  // proxy will forward all the calls to the FiatTokenV1 impl
  await fiatTokenV1Proxied.initialize(
    "USD//C",
    "USDC",
    "USD",
    6,
    masterMinter,
    pauser,
    blacklister,
    owner
  );
};
