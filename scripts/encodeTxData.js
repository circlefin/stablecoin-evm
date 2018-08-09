// Description:
// Returns "data" parameter for Ethereum transaction of an upgraded token
// Note: Addresses must start with 0x

// Args:
// arg0: truffle
// arg1: exec
// arg2: --compile
// arg3: encodeTxData.js
// arg4: name of contract (e.g. FiatTokenV2NewFieldsTest). Do not pass the source file name.
// arg5: function name (e.g. initV2)
// arg6+: solidity argument values

// Example usage:
// make sure Ganache is running (`ganache-cli --defaultBalanceEther 1000000 --deterministic --a 15`)
// run `truffle compile` to generate build artifacts, or pass `-c` or `--compile` after exec, as in the following example:
// `truffle exec --compile encodeTxData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12`
// returns
// 0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c

var args = process.argv;
// slice off the paths to node and truffle executables, which are included automatically
args = args.slice(2)
// slice off everything from truffle through name of this file
if (args[1] == "--compile" || args[1] == "-c") {
	args = args.slice(3)
} else {
	args = args.slice(2)
}

var contractName = args[0]
// slice off name of contract
args = args.slice(1);

var ContractArtifact = artifacts.require(contractName)

async function run() {
	// TODO support contracts with more than zero constructor parameters
	var contract = await ContractArtifact.new();
	var func = args[0]
	// slice off name of function, leaving only solidity parameter values
	args = args.slice(1)
	var data = contract[func].request.apply(null, args)["params"][0]["data"]
	console.log(data)
}

module.exports = async function(callback) {
  await run();
  callback();
}