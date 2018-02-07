var FiatToken = artifacts.require('FiatToken');
var name = 'Sample Fiat Token';
var symbol = 'C-USD';
var currency = 'USD';
var decimals = 2;

contract('FiatToken', function (accounts) {
  let token;

  beforeEach(async function () {
    token = await FiatToken.new(name, symbol, currency, decimals);
  });

  it('should start with a totalSupply of 0', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 0);
  });

  it('should return mintingFinished false after construction', async function () {
    let mintingFinished = await token.mintingFinished();

    assert.equal(mintingFinished, false);
  });

  it('should mint a given amount of tokens to a given address', async function () {
    const result = await token.mint(accounts[0], 100);
    assert.equal(result.logs[0].event, 'Mint');
    assert.equal(result.logs[0].args.to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args.amount.valueOf(), 100);
    assert.equal(result.logs[1].event, 'Transfer');
    assert.equal(result.logs[1].args.from.valueOf(), 0x0);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 100);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
  });

  it('should add mutliple mints to a given address in address balance', async function () {
    await token.mint(accounts[0], 100);
    await token.mint(accounts[0], 200);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 300);

  });


  it('should add mutliple mints to total supply', async function () {
    await token.mint(accounts[0], 100);
    await token.mint(accounts[0], 400);
    await token.mint(accounts[1], 600);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 1100);
  });

  it('should fail to mint from a non-owner call', async function () {
     token.mint(accounts[0], 400);
     try {
      await token.mint(accounts[0], 100, {from: accounts[1]});
      assert.fail();
    } catch (e) {

    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 400);
    }
  });

  it('should fail to mint after call to finishMinting', async function () {
    await token.finishMinting();
    assert.equal(await token.mintingFinished(), true);
    try {
      await (token.mint(accounts[0], 100));
      assert.fail("Minting not stopped");
    } catch (e) {}

  });

  it('should set allowance and balances before and after approved transfer', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.equal(allowed.c[0], 0);
    await token.mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.equal(allowed.c[0], 100);

    await token.transferFrom(accounts[0], accounts[3], 50, {from: accounts[3]});

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 450);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 50);

  });

  it('should fail on unauthorized approved transfer and not change balances', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.equal(allowed.c[0], 0);
    await token.mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.equal(allowed.c[0], 100);

    try {
      await token.transferFrom(accounts[0], accounts[3], 50, {from: accounts[4]});
      assert.fail()
    } catch(e) {

    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 500);
      let balance3 = await token.balanceOf(accounts[3]);
      assert.equal(balance3, 0);
    }
  });

  it('should fail on invalid approved transfer amount and not change balances', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.equal(allowed.c[0], 0);
    await token.mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.equal(allowed.c[0], 100);

    try {
      await token.transferFrom(accounts[0], accounts[3], 450, {from: accounts[3]});
      assert.fail()
    } catch(e) {

    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 500);
      let balance3 = await token.balanceOf(accounts[3]);
      assert.equal(balance3, 0);
    }
  });

  it('should have correct name', async function () {
    let actual = await token.name.call();
    assert.equal(actual, name);
  });

  it('should have correct symbol', async function () {
    let actual = await token.symbol.call();
    assert.equal(actual, symbol);
  });

  it('should have correct decimals', async function () {
    let actual = await token.decimals.call();
    assert.equal(actual, decimals);
  });

  it('should have correct currency', async function () {
    let actual = await token.currency.call();
    assert.equal(actual, currency);
  });

});
