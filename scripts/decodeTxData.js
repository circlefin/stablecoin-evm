const InputDataDecoder = require('ethereum-input-data-decoder')
var fs = require('fs')
var mkdirp = require('mkdirp')
var args = process.argv;

var helpText = `Decodes "data" field of ethereum transactions
args:
"--truffle-artifact" or "--abi-path":
  "--truffle-artifact": name of truffle-artifact (contract name)
  "--abi-path": /path/to/abi.json (contents of file should be one abi array)
"--data": hex used as input data to ethereum transaction. Encodes function name, parameter types, and parameter values
"--filename": (optional) file name used for decoded output. File is saved to ./decoded_data/<filename>.json. If no filename is provided, output is logged to stdout.

example using truffle with --truffle-artifact:
- in process 1, run ganache: $ ganache-cli
- in process 2, compile contracts to /build/contracts/ folder: $ truffle compile
- in process 2, run decoder: $ truffle exec decodeTxData.js --truffle-artifact FiatTokenV1 --data 0x4e44d9560000000000000000000000009c08210cc65b5c9f1961cdbd9ea9bf017522464d000000000000000000000000000000000000000000000000000000003b9aca00$ --filename configureMinter
Output: new file is created at decoded_data/configureMinter.json:
{  
   "name":"configureMinter",
   "types":[  
      "address",
      "uint256"
   ],
   "inputs":[  
      "9c08210cc65b5c9f1961cdbd9ea9bf017522464d",
      "1000000000"
   ]
}

example using just node with --abi-path:
- (ensure that correct abi is located at --abi-path)
- run decoder: $ node decodeTxData.js --abi-path ./tests/FiatTokenProxy_abi.json --data 4f1ef286000000000000000000000000023fe1585d8361f0584aaa78c152f94cdcff7b3000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000064d76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000 --filename upgradeToAndCall
Output: new file is created at decoded_data/upgradeToAndCall.json:
{  
   "name":"upgradeToAndCall",
   "types":[  
      "address",
      "bytes"
   ],
   "inputs":[  
      "023fe1585d8361f0584aaa78c152f94cdcff7b30",
      "d76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c"
   ]
}
`

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

function decode() {
  var helpFlagIndex = args.indexOf("--help");
  if (helpFlagIndex != -1) {
    console.log(helpText)
    return
  }

  var dataFlagIndex = args.indexOf("--data");
  var data = args[dataFlagIndex + 1]
  var truffleArtifactFlagIndex = args.indexOf("--truffle-artifact")
  var abiPathFlagIndex = args.indexOf("--abi-path")
  var outputFileNameFlagIndex = args.indexOf("--filename")

  var abi;

  if (abiPathFlagIndex != -1) {
    var abiPathIndex = args[abiPathFlagIndex + 1]
    var abiStr = fs.readFileSync(abiPathIndex, "utf8")
    abi = JSON.parse(abiStr)
  } else {
    if (truffleArtifactFlagIndex != -1) {
      var truffleArtifactName = args[truffleArtifactFlagIndex + 1]
      var truffleArtifact = artifacts.require(truffleArtifactName)
      abi = truffleArtifact.abi
    } else {
      throw new Error(`ABI is missing. Pass in the ABI with one of the following flags:
        --abi-path /path/to/abi.json
        --truffle-artifact nameOfContract
        print full instructions with: --help
        `)
    }
  }

  var decoder = new InputDataDecoder(abi)
  result = decoder.decodeData(data)
    for (i = 0; i < result.inputs.length; i++) {
      // if the the type is object and corresponding type in type array is uint, try to parse it
      if ((typeof result.inputs[i] == "object") && result.types[i].includes("uint")) {
        result.inputs[i] = result.inputs[i].toString()
      }
      if (result.types[i] == "bytes") {
        result.inputs[i] = toHexString(result.inputs[i])
      }
    }
  var decodedDataJson = JSON.stringify(result)

  if (outputFileNameFlagIndex != -1) {
    outputFileName = args[outputFileNameFlagIndex + 1]
    mkdirp.sync('decoded_data')
    fs.writeFileSync('decoded_data/' + outputFileName + '.json', decodedDataJson, 'utf8');
  } else {
    console.log(decodedDataJson)
  }
}

decode()

module.exports = async function(callback) {
  callback()
}