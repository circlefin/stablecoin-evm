const Web3 = require('web3');

// Replace the following values with your contract's constructor arguments
const constructorArgs = [
  '000000000000000000000000c4988f9629a4f68fe642f3f9c2407c6b4d723a38'
];

const web3 = new Web3();
const encodedArgs = web3.eth.abi.encodeParameters(['address'], constructorArgs);

console.log(`ABI-encoded constructor arguments: ${encodedArgs}`);
