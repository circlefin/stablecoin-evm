const assert = require('assert');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var fs = require('fs')

describe('transaction data encoding and decoding tests', function() {
  // disable timeouts
  this.timeout(0);

  var initV2Data = "d76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c";
  var upgradeToAndCallData = "4f1ef286000000000000000000000000023fe1585d8361f0584aaa78c152f94cdcff7b3000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000064d76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000"
  var configureMinterData = "4e44d9560000000000000000000000009c08210cc65b5c9f1961cdbd9ea9bf017522464d000000000000000000000000000000000000000000000000000000003b9aca00"

  it('td001 should return correct data using encodeTxData with --compile flag', async function () {
      const { stdout, stderr } = await exec('truffle exec --compile ./scripts/encodeTxData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12');
      assert(stdout.includes(initV2Data))
  })

  it('td002 should return correct data using encodeTxData with -c flag', async function () {
      const { stdout, stderr } = await exec('truffle exec -c ./scripts/encodeTxData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12');
      assert(stdout.includes(initV2Data))
  })

  it('td003 should return correct data using encodeTxData without using compile flag', async function () {
      const { stdout, stderr } = await exec('truffle exec ./scripts/encodeTxData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12');
      assert(stdout.includes(initV2Data))
  })

  it('td004 should return correct data for FiatTokenV1 method configureMinter', async function () {
      const { stdout, stderr } = await exec('truffle exec ./scripts/encodeTxData.js FiatTokenV1 configureMinter 0x9c08210cc65b5c9f1961cdbd9ea9bf017522464d 1000000000');
      assert(stdout.includes(configureMinterData))
  })

  it("td005 should decode a data string and output decoded result to stdout stream", async function () {
    const { stdout, stderr } = await exec("truffle exec ./scripts/decodeTxData.js --truffle-artifact FiatTokenV1 --data " + configureMinterData);

    // trim extra output from truffle
    var bracketIndex = stdout.indexOf("{")
    var stdoutJson = stdout.substring(bracketIndex)
    var decodedData = JSON.parse(stdoutJson);
    assert.equal(decodedData.name, "configureMinter")
    assert.equal(decodedData.types[0], "address")
    assert.equal(decodedData.types[1], "uint256")
    assert.equal(decodedData.inputs[0], "9c08210cc65b5c9f1961cdbd9ea9bf017522464d")
    assert.equal(decodedData.inputs[1], "1000000000")
  })

  it('td006 should decode a data string and output decoded result to a file', async function () {
    await exec("truffle exec ./scripts/decodeTxData.js --truffle-artifact FiatTokenV1 --data " + configureMinterData + " --filename configureMinterTest");
    var decodedDataJson = fs.readFileSync('./scripts/decoded_data/configureMinterTest.json');
    var decodedData = JSON.parse(decodedDataJson);
    assert.equal(decodedData.name, "configureMinter")
    assert.equal(decodedData.types[0], "address")
    assert.equal(decodedData.types[1], "uint256")
    assert.equal(decodedData.inputs[0], "9c08210cc65b5c9f1961cdbd9ea9bf017522464d")
    assert.equal(decodedData.inputs[1], "1000000000")
  })

  it('td007 should decode a data string for FiatTokenProxy and its byte array input to a hex string', async function () {
    await exec ("truffle exec scripts/decodeTxData.js --truffle-artifact FiatTokenProxy --data " + upgradeToAndCallData + " --filename upgradeToAndCallTruffleTest")
    var decodedDataJson = fs.readFileSync('./scripts/decoded_data/upgradeToAndCallTruffleTest.json');
    var decodedData = JSON.parse(decodedDataJson);
    assert.equal(decodedData.name, "upgradeToAndCall")
    assert.equal(decodedData.types[0], "address")
    assert.equal(decodedData.types[1], "bytes")
    assert.equal(decodedData.inputs[0], "023fe1585d8361f0584aaa78c152f94cdcff7b30")
    assert.equal(decodedData.inputs[1], initV2Data)
  })

  it('td008 should decode a data string using --abi-path', async function () {
    fiatTokenProxyCompiled = fs.readFileSync("./build/contracts/FiatTokenProxy.json", "utf8");
    fiatTokenProxyJson = JSON.parse(fiatTokenProxyCompiled)
    fs.writeFileSync("./scripts/tests/FiatTokenProxy_abi.json", JSON.stringify(fiatTokenProxyJson.abi), 'utf8')

    await exec ("cd scripts && node ./decodeTxData.js --abi-path ./tests/FiatTokenProxy_abi.json --data " + upgradeToAndCallData + " --filename upgradeToAndCallNodeTest")
    var decodedDataJson = fs.readFileSync('./scripts/decoded_data/upgradeToAndCallNodeTest.json');
    var decodedData = JSON.parse(decodedDataJson);
    assert.equal(decodedData.name, "upgradeToAndCall")
    assert.equal(decodedData.types[0], "address")
    assert.equal(decodedData.types[1], "bytes")
    assert.equal(decodedData.inputs[0], "023fe1585d8361f0584aaa78c152f94cdcff7b30")
    assert.equal(decodedData.inputs[1], initV2Data)
  })
})