const { Transaction } = require("ethereumjs-tx");

async function makeRawTransaction(data, from, hexPrivateKey, contractAddress) {
  const tx = new Transaction({
    nonce: web3.utils.toHex(await web3.eth.getTransactionCount(from)),
    gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei")),
    gasLimit: 1000000,
    to: contractAddress,
    value: 0,
    data,
  });
  const privateKey = Buffer.from(hexPrivateKey, "hex");
  tx.sign(privateKey);
  const raw = "0x" + tx.serialize().toString("hex");
  return raw;
}

function sendRawTransaction(raw) {
  return new Promise((resolve, reject) => {
    web3.eth.sendSignedTransaction(raw, (err, transactionHash) => {
      if (err !== null) return reject(err);
      resolve(transactionHash);
    });
  });
}

function functionSignature(methodName) {
  return web3.utils.keccak256(methodName).slice(0, 10);
}

function encodeAddress(address) {
  address = address.substr(2, address.length - 2);
  while (address.length < 64) address = "0" + address;
  return address;
}

function encodeUint(value) {
  value = value.toString(16);
  while (value.length < 64) value = "0" + value;
  return value;
}

// Create ABI calls for functions
function msgData0(methodName, value) {
  return functionSignature(methodName) + encodeUint(value);
}

function msgData(methodName, addressValue) {
  return functionSignature(methodName) + encodeAddress(addressValue);
}

function msgData1(methodName, address, value) {
  return (
    functionSignature(methodName) + encodeAddress(address) + encodeUint(value)
  );
}

function msgData2(methodName, address1, address2, value) {
  return (
    functionSignature(methodName) +
    encodeAddress(address1) +
    encodeAddress(address2) +
    encodeUint(value)
  );
}

function msgData3(methodName, address1, value1, address2, value2) {
  return (
    functionSignature(methodName) +
    encodeAddress(address1) +
    encodeUint(value1) +
    encodeAddress(address2) +
    encodeUint(value2)
  );
}

module.exports = {
  makeRawTransaction,
  sendRawTransaction,
  functionSignature,
  encodeAddress,
  encodeUint,
  msgData0,
  msgData,
  msgData1,
  msgData2,
  msgData3,
};
