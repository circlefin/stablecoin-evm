var CentreTokenRegistry = artifacts.require('CentreTokenRegistry');

contract('CentreTokenRegistry', function (accounts) {
  let registry;

  beforeEach(async function () {
    registry = await CentreTokenRegistry.new();
  });

  it('should add token and store proper token object values', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenAdded');
    let tokenEntry = await registry.registry.call(tokenAddress);

    assert.equal(tokenEntry[0], approvedDate);
    assert.equal(tokenEntry[1], auditDate);
    assert.equal(tokenEntry[2], auditHash);
    assert.equal(tokenEntry[3], true);

  });

  it('should fail to add token from a non-owner call', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    try {
      storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash, {from: accounts[1]});
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], '');
      assert.equal(tokenEntry[1], '');
      assert.equal(tokenEntry[2], '0x0000000000000000000000000000000000000000000000000000000000000000');
      assert.equal(tokenEntry[3], false);
    }

  });

  it('should fail to add token if same token already exists in registry', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);

    var tokenAddress2 = accounts[9];
    var approvedDate2 = '1-12-18';
    var auditDate2 = '1-12-18';
    var auditHash2 = web3.sha3('disney world');

    try {
      storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], approvedDate);
      assert.equal(tokenEntry[1], auditDate);
      assert.equal(tokenEntry[2], auditHash);
      assert.equal(tokenEntry[3], true);
    }

  });

  it('should remove token and clear record', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenAdded');
    storedTokenAddress = await registry.removeToken(tokenAddress);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenRemoved');

    let tokenEntry = await registry.registry.call(tokenAddress);

    assert.equal(tokenEntry[0], '');
    assert.equal(tokenEntry[1], '');
    assert.equal(tokenEntry[2], '0x0000000000000000000000000000000000000000000000000000000000000000');
    assert.equal(tokenEntry[3], false);

  });

  it('should fail to remove token from a non-owner call', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenAdded');

    try {
      storedTokenAddress = await registry.removeToken(tokenAddress, {from: accounts[1]});
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], approvedDate);
      assert.equal(tokenEntry[1], auditDate);
      assert.equal(tokenEntry[2], auditHash);
      assert.equal(tokenEntry[3], true);
    }

  });

  it('should fail to remove non-existent token', async function () {
    let tokenAddress = accounts[9];
    try {
      var storedTokenAddress = await registry.removeToken(tokenAddress);
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], '');
      assert.equal(tokenEntry[1], '');
      assert.equal(tokenEntry[2], '0x0000000000000000000000000000000000000000000000000000000000000000');
      assert.equal(tokenEntry[3], false);
    }

  });

  it('should update token and store new values', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenAdded');

    let auditDateNew = '3-12-18';
    let auditHashNew = web3.sha3('disney world');
    storedTokenAddress = await registry.updateAudit(tokenAddress, auditDateNew, auditHashNew);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenUpdated');

    let tokenEntry = await registry.registry.call(tokenAddress);

    assert.equal(tokenEntry[0], approvedDate);
    assert.equal(tokenEntry[1], auditDateNew);
    assert.equal(tokenEntry[2], auditHashNew);
    assert.equal(tokenEntry[3], true);

  });

  it('should fail update token from a non-owner call', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenAdded');

    let auditDateNew = '3-12-18';
    let auditHashNew = web3.sha3('disney world');

    try {
      storedTokenAddress = await registry.updateAudit(tokenAddress, auditDateNew, auditHashNew, {from: accounts[1]});
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], approvedDate);
      assert.equal(tokenEntry[1], auditDate);
      assert.equal(tokenEntry[2], auditHash);
      assert.equal(tokenEntry[3], true);
    }

  });


  it('should fail to update token that does not exist', async function () {
    let tokenAddress = accounts[9];
    try {
      storedTokenAddress = await registry.updateAudit(tokenAddress, auditDateNew, auditHashNew);
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], '');
      assert.equal(tokenEntry[1], '');
      assert.equal(tokenEntry[2], '0x0000000000000000000000000000000000000000000000000000000000000000');
      assert.equal(tokenEntry[3], false);
    }

  });

  it('should update token approval date', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenAdded');

    let approvedDateNew = '3-12-18';
    storedTokenAddress = await registry.correctApprovedDate(tokenAddress, approvedDateNew);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenUpdated');

    let tokenEntry = await registry.registry.call(tokenAddress);

    assert.equal(tokenEntry[0], approvedDateNew);
    assert.equal(tokenEntry[1], auditDate);
    assert.equal(tokenEntry[2], auditHash);
    assert.equal(tokenEntry[3], true);

  });

  it('should fail update token approval date from a non-owner call', async function () {
    let tokenAddress = accounts[9];
    let approvedDate = '1-12-18';
    let auditDate = '1-12-18';
    let auditHash = web3.sha3('hello world');
    let storedTokenAddress = await registry.addToken(tokenAddress, approvedDate, auditDate, auditHash);
    assert.equal(storedTokenAddress.logs[0].event, 'TokenAdded');

    let approvedDateNew = '3-12-18';
    try {
      storedTokenAddress = await registry.correctApprovedDate(tokenAddress, approvedDateNew, {from: accounts[1]});
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], approvedDate);
      assert.equal(tokenEntry[1], auditDate);
      assert.equal(tokenEntry[2], auditHash);
      assert.equal(tokenEntry[3], true);
    }

  });

  it('should fail to update token approval date for non-existent token', async function () {
    let tokenAddress = accounts[9];
    let approvedDateNew = '3-12-18';
    try {    
      storedTokenAddress = await registry.correctApprovedDate(tokenAddress, approvedDateNew);
      assert.fail();
    } catch(e) {

    } finally {
      let tokenEntry = await registry.registry.call(tokenAddress);
      assert.equal(tokenEntry[0], '');
      assert.equal(tokenEntry[1], '');
      assert.equal(tokenEntry[2], '0x0000000000000000000000000000000000000000000000000000000000000000');
      assert.equal(tokenEntry[3], false);
    }

  });

});
