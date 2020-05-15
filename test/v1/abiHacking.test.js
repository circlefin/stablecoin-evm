const { Transaction } = require("ethereumjs-tx");
const wrapTests = require("./helpers/wrapTests");
const {
  expectRevert,
  checkVariables,
  initializeTokenWithProxy,
  arbitraryAccount,
  pauserAccount,
  tokenOwnerAccount,
  arbitraryAccountPrivateKey,
  tokenOwnerPrivateKey,
  pauserAccountPrivateKey,
} = require("./helpers/tokenTest");
const {
  makeRawTransaction,
  sendRawTransaction,
  functionSignature,
  encodeAddress,
  encodeUint,
  msgData,
} = require("./helpers/abi");

// Encodes methodName, 32 byte string of 0, and address.
function mockStringAddressEncode(methodName, address) {
  const version = encodeUint(32) + encodeUint(0); // encode 32 byte string of 0's
  return functionSignature(methodName) + version + encodeAddress(address);
}

function runTests(newToken, _accounts) {
  let proxy, token;

  beforeEach(async () => {
    const rawToken = await newToken();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  // sanity check for pausable
  it("abi004 FiatToken pause() is public", async () => {
    const badData = functionSignature("pause()");
    const tx = new Transaction({
      nonce: web3.utils.toHex(
        await web3.eth.getTransactionCount(pauserAccount)
      ),
      gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
      gasLimit: 100000,
      to: token.address,
      value: 0,
      data: badData,
    });
    const privateKey = Buffer.from(pauserAccountPrivateKey, "hex");
    tx.sign(privateKey);
    const raw = "0x" + tx.serialize().toString("hex");

    await sendRawTransaction(raw);
    const customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
  });

  it("abi040 Blacklistable constructor is not a function", async () => {
    const badData = functionSignature("Blacklistable()");
    const tx = new Transaction({
      nonce: web3.utils.toHex(
        await web3.eth.getTransactionCount(pauserAccount)
      ),
      gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
      gasLimit: 100000,
      to: token.address,
      value: 0,
      data: badData,
    });
    const privateKey = Buffer.from(pauserAccountPrivateKey, "hex");
    tx.sign(privateKey);
    const raw = "0x" + tx.serialize().toString("hex");

    await expectRevert(sendRawTransaction(raw));
  });

  it("abi042 Ownable constructor is not a function", async () => {
    const badData = functionSignature("Ownable()");
    const tx = new Transaction({
      nonce: web3.utils.toHex(
        await web3.eth.getTransactionCount(pauserAccount)
      ),
      gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
      gasLimit: 100000,
      to: token.address,
      value: 0,
      data: badData,
    });
    const privateKey = Buffer.from(pauserAccountPrivateKey, "hex");
    tx.sign(privateKey);
    const raw = "0x" + tx.serialize().toString("hex");

    await expectRevert(sendRawTransaction(raw));
  });

  it("abi005 Pausable constructor is not a function", async () => {
    const badData = functionSignature("Pausable()");
    const tx = new Transaction({
      nonce: web3.utils.toHex(
        await web3.eth.getTransactionCount(pauserAccount)
      ),
      gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
      gasLimit: 100000,
      to: token.address,
      value: 0,
      data: badData,
    });
    const privateKey = Buffer.from(pauserAccountPrivateKey, "hex");
    tx.sign(privateKey);
    const raw = "0x" + tx.serialize().toString("hex");

    await expectRevert(sendRawTransaction(raw));
  });

  it("abi043 FiatTokenProxy constructor is not a function", async () => {
    const badData = functionSignature("FiatTokenProxy()");
    const tx = new Transaction({
      nonce: web3.utils.toHex(
        await web3.eth.getTransactionCount(pauserAccount)
      ),
      gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
      gasLimit: 100000,
      to: token.address,
      value: 0,
      data: badData,
    });
    const privateKey = Buffer.from(pauserAccountPrivateKey, "hex");
    tx.sign(privateKey);
    const raw = "0x" + tx.serialize().toString("hex");

    await expectRevert(sendRawTransaction(raw));
  });

  it("abi027 UpgradeabilityProxy constructor", async () => {
    const badData = msgData("UpgradeabilityProxy(address)", arbitraryAccount);
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi055 Proxy constructor is not a function", async () => {
    const badData = functionSignature("Proxy()");
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi056 Proxy _delegate is internal", async () => {
    const badData = msgData("_delegate(address)", arbitraryAccount);
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi057 Proxy _willFallback is internal", async () => {
    const badData = functionSignature("_willFallback()");
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi058 Proxy _fallback is internal", async () => {
    const badData = functionSignature("_fallback()");
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi050 Upgradeability implementation is internal", async () => {
    const badData = msgData("UpgradeabilityProxy(address)", arbitraryAccount);
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi051 AdminUpgradeabillityProxy constructor is not a function", async () => {
    const badData = msgData(
      "AdminUpgradeabillityProxy(address)",
      arbitraryAccount
    );
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi053 AdminUpgradeabillityProxy _setAdmin is internal", async () => {
    const badData = msgData(
      "AdminUpgradeabillityProxy(address)",
      arbitraryAccount
    );
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi041 FiatToken constructor is not a function", async () => {
    const badData = functionSignature("FiatToken()");
    const tx = new Transaction({
      nonce: web3.utils.toHex(
        await web3.eth.getTransactionCount(pauserAccount)
      ),
      gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
      gasLimit: 100000,
      to: token.address,
      value: 0,
      data: badData,
    });
    const privateKey = Buffer.from(pauserAccountPrivateKey, "hex");
    tx.sign(privateKey);
    const raw = "0x" + tx.serialize().toString("hex");

    await expectRevert(sendRawTransaction(raw));
  });

  it("abi025 setOwner is internal", async () => {
    const badData = msgData("setOwner(address)", pauserAccount);
    const tx = new Transaction({
      nonce: web3.utils.toHex(
        await web3.eth.getTransactionCount(tokenOwnerAccount)
      ),
      gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
      gasLimit: 100000,
      to: token.address,
      value: 0,
      data: badData,
    });
    const privateKey = Buffer.from(tokenOwnerPrivateKey, "hex");
    tx.sign(privateKey);
    const raw = "0x" + tx.serialize().toString("hex");

    await expectRevert(sendRawTransaction(raw));
  });

  it("abi028 UpgradeabilityProxy._upgradeTo is internal", async () => {
    const badData = mockStringAddressEncode(
      "_upgradeTo(string,address)",
      pauserAccount
    );
    const raw = await makeRawTransaction(
      badData,
      tokenOwnerAccount,
      tokenOwnerPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });
}

wrapTests("FiatToken ABI hacking", runTests);
