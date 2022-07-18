// run with `yarn truffle exec scripts/gas_usage_v2_vs_v3.js`

const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV3 = artifacts.require("FiatTokenV3");

module.exports = async function (callback) {
  try {
    const [fiatTokenOwner, alice, bob] = await web3.eth.getAccounts();
    const mintAmount = 50e6;
    const transferAmount = 10e6;

    const fiatTokenV3 = await initializeV3(fiatTokenOwner);
    const fiatTokenV2_1 = await initializeV2_1(fiatTokenOwner);

    await fiatTokenV3.mint(alice, mintAmount, { from: fiatTokenOwner });
    const transferTxV3 = await fiatTokenV3.transfer(bob, transferAmount, {
      from: alice,
    });
    console.log("V3 transfer gas usage:", transferTxV3.receipt.gasUsed);

    await fiatTokenV2_1.mint(alice, mintAmount, {
      from: fiatTokenOwner,
    });
    const transferTxV2_1 = await fiatTokenV2_1.transfer(bob, transferAmount, {
      from: alice,
    });
    console.log("V2.1 transfer gas usage:", transferTxV2_1.receipt.gasUsed);

    const approvalTxV3 = await fiatTokenV3.approve(bob, transferAmount, {
      from: alice,
    });
    console.log("V3 approve gas usage:", approvalTxV3.receipt.gasUsed);

    const approvalTxV2_1 = await fiatTokenV2_1.approve(bob, transferAmount, {
      from: alice,
    });
    console.log("V2.1 approve gas usage:", approvalTxV2_1.receipt.gasUsed);

    const transferFromTxV3 = await fiatTokenV3.transferFrom(
      alice,
      bob,
      transferAmount,
      {
        from: bob,
      }
    );
    console.log("V3 transferFrom gas usage:", transferFromTxV3.receipt.gasUsed);

    const transferFromTxV2_1 = await fiatTokenV2_1.transferFrom(
      alice,
      bob,
      transferAmount,
      {
        from: bob,
      }
    );
    console.log(
      "V2.1 transferFrom gas usage:",
      transferFromTxV2_1.receipt.gasUsed
    );
  } catch (error) {
    console.log(error);
  }

  callback();
};

async function initializeV3(fiatTokenOwner) {
  const fiatTokenV3 = await FiatTokenV3.new();

  await fiatTokenV3.initialize(
    "USD Coin",
    "USDC",
    "USD",
    6,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner
  );
  await fiatTokenV3.initializeV2("USD Coin", { from: fiatTokenOwner });
  await fiatTokenV3.initializeV2_1(fiatTokenOwner, { from: fiatTokenOwner });
  await fiatTokenV3.initializeV3([], { from: fiatTokenOwner });

  await fiatTokenV3.configureMinter(fiatTokenOwner, 1000000e6, {
    from: fiatTokenOwner,
  });

  return fiatTokenV3;
}

async function initializeV2_1(fiatTokenOwner) {
  const fiatTokenV2_1 = await FiatTokenV2_1.new();

  await fiatTokenV2_1.initialize(
    "USD Coin",
    "USDC",
    "USD",
    6,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner
  );
  await fiatTokenV2_1.initializeV2("USD Coin", { from: fiatTokenOwner });
  await fiatTokenV2_1.initializeV2_1(fiatTokenOwner, { from: fiatTokenOwner });

  await fiatTokenV2_1.configureMinter(fiatTokenOwner, 1000000e6, {
    from: fiatTokenOwner,
  });

  return fiatTokenV2_1;
}
