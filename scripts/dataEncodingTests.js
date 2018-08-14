const assert = require('assert');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var fs = require('fs')

describe('transaction data encoding and decoding tests', function() {
  // disable timeouts
  this.timeout(0);

  var initV2Data = "0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c";
  var configureMinterData = "0x4e44d9560000000000000000000000009c08210cc65b5c9f1961cdbd9ea9bf017522464d000000000000000000000000000000000000000000000000000000003b9aca00"

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
    const { stdout, stderr } = await exec("truffle exec ./scripts/decodeTxData.js --contract FiatTokenV1 --data " + configureMinterData);

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
    await exec("truffle exec ./scripts/decodeTxData.js --contract FiatTokenV1 --data " + configureMinterData);
    var decodedDataJson = fs.readFileSync('decoded_data/' + configureMinterData + '.json');
    var decodedData = JSON.parse(decodedDataJson);
    assert.equal(decodedData.name, "configureMinter")
    assert.equal(decodedData.types[0], "address")
    assert.equal(decodedData.types[1], "uint256")
    assert.equal(decodedData.inputs[0], "9c08210cc65b5c9f1961cdbd9ea9bf017522464d")
    assert.equal(decodedData.inputs[1], "1000000000")
  })
})