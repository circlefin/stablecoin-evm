// Decodes "data" field of ethereum transactions
// newest ABI should be built before running this script (`truffle compile` generates build/contracts directory)
// args:
// "--contract": name of contract
// "--data": hex used as input data to ethereum transaction. Encodes function name, parameter types, and parameter values

// example:
// `truffle exec decodeTxData.js --contract FiatTokenV1 --data 0x4e44d9560000000000000000000000009c08210cc65b5c9f1961cdbd9ea9bf017522464d000000000000000000000000000000000000000000000000000000003b9aca00`
// { name: 'configureMinter',
//  types: [ 'address', 'uint256' ],
//  inputs: [ '9c08210cc65b5c9f1961cdbd9ea9bf017522464d', 1000000000 ] }
const InputDataDecoder = require('ethereum-input-data-decoder')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

var args = process.argv;

var dataFlagIndex = args.indexOf("--data");
var data = args[dataFlagIndex + 1]
var contractNameFlagIndex = args.indexOf("--contract")
var contractName = args[contractNameFlagIndex + 1]

var FiatTokenVX = artifacts.require(contractName)
var abi = FiatTokenVX.abi
var decoder = new InputDataDecoder(abi)

function decode() {
  result = decoder.decodeData(data)
    for (i = 0; i < result.inputs.length; i++) {
      // if the the type is object and corresponding type in type array is uint, try to parse it
      if ((typeof result.inputs[i] == "object") && result.types[i].includes("uint")) {
        result.inputs[i] = result.inputs[i].toString()
      }
    }

  var decodedDataJson = JSON.stringify(result)
  console.log(decodedDataJson)

  mkdirp.sync('decoded_data')
  fs.writeFileSync('decoded_data/' + data + '.json', decodedDataJson, 'utf8');
}

module.exports = async function(callback) {
  decode()
  callback()
}