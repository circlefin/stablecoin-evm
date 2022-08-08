// run with `yarn truffle exec scripts/gas_usage_v2_1_vs_v2_2.js`

const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

module.exports = async function (callback) {
  try {
    const [fiatTokenOwner, alice, bob] = await web3.eth.getAccounts();
    const mintAmount = 50e6;
    const transferAmount = 10e6;

    const fiatTokenV2_2 = await initializeV2_2(fiatTokenOwner);
    const fiatTokenV2_1 = await initializeV2_1(fiatTokenOwner);

    await FiatTokenV2_2.mint(alice, mintAmount, { from: fiatTokenOwner });
    const transferTxV2_2 = await FiatTokenV2_2.transfer(bob, transferAmount, {
      from: alice,
    });
    console.log("V2.2 transfer gas usage:", transferTxV2_2.receipt.gasUsed);

    await fiatTokenV2_1.mint(alice, mintAmount, {
      from: fiatTokenOwner,
    });
    const transferTxV2_1 = await fiatTokenV2_1.transfer(bob, transferAmount, {
      from: alice,
    });
    console.log("V2.1 transfer gas usage:", transferTxV2_1.receipt.gasUsed);

    const approvalTxV2_2 = await fiatTokenV2_2.approve(bob, transferAmount, {
      from: alice,
    });
    console.log("V2.2 approve gas usage:", approvalTxV2_2.receipt.gasUsed);

    const approvalTxV2_1 = await fiatTokenV2_1.approve(bob, transferAmount, {
      from: alice,
    });
    console.log("V2.1 approve gas usage:", approvalTxV2_1.receipt.gasUsed);

    const transferFromTxV2_2 = await fiatTokenV2_2.transferFrom(
      alice,
      bob,
      transferAmount,
      {
        from: bob,
      }
    );
    console.log(
      "V2.2 transferFrom gas usage:",
      transferFromTxV2_2.receipt.gasUsed
    );

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

async function initializeV2_2(fiatTokenOwner) {
  const fiatTokenV2_2 = await FiatTokenV2_2.new();

  await fiatTokenV2_2.initialize(
    "USD Coin",
    "USDC",
    "USD",
    6,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner
  );
  await fiatTokenV2_2.initializeV2("USD Coin", { from: fiatTokenOwner });
  await fiatTokenV2_2.initializeV2_1(fiatTokenOwner, { from: fiatTokenOwner });
  await fiatTokenV2_2.initializeV2_2([], { from: fiatTokenOwner });

  await fiatTokenV2_2.configureMinter(fiatTokenOwner, 1000000e6, {
    from: fiatTokenOwner,
  });

  return fiatTokenV2_2;
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
