const assert = require('assert');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('buildTransactionData.js tests', function() {
  // disable timeouts
  this.timeout(0);

  it('btd001 should return correct data using buildTransactionData with --compile flag', async function () {
      const { stdout, stderr } = await exec('truffle exec --compile ./scripts/buildTransactionData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12');
      assert(stdout.includes("0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c"), stdout)
  })

  it('btd002 should return correct data using buildTransactionData with -c flag', async function () {
      const { stdout, stderr } = await exec('truffle exec -c ./scripts/buildTransactionData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12');
      assert(stdout.includes("0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c"), stdout)
  })

  it('btd003 should return correct data using buildTransactionData without using compile flag', async function () {
      const { stdout, stderr } = await exec('truffle exec ./scripts/buildTransactionData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12');
      assert(stdout.includes("0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c"), stdout)
  })
})