var execSync = require('child_process').execSync;
const assert = require('assert');

// run with truffle test
describe('buildTransactionData.js script tests', function() {
  // disable timeouts
  this.timeout(0);  

  it('btd001 should return correct data without using --compile', function () {
    execSync('truffle compile', function () {
      execSync('truffle exec ./scripts/buildTransactionData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12',
        function (error, stdOut, stdErr) {
          assert(stdOut.includes("0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c"), stdOut)
          console.log('Test passed: generates data correctly without using --compile, since build directory already exists')
      });
    })
  })

  it('btd002 should return correct data using --compile flag', function () {
    execSync('truffle exec --compile ./scripts/buildTransactionData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12',
      function (error, stdOut, stdErr) {
        assert(stdOut.includes("0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c"), stdOut)
        console.log('Test passed: generates data correctly using --compile flag')
    });
  })

  it('btd003 should return correct data using -c flag', function () {
    execSync('truffle exec -c ./scripts/buildTransactionData.js FiatTokenV2NewFieldsTest initV2 true 0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e 12',
      function (error, stdOut, stdErr) {
        assert(stdOut.includes("0xd76c43c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000aca94ef8bd5ffee41947b4585a84bda5a3d3da6e000000000000000000000000000000000000000000000000000000000000000c"), stdOut)
        console.log('Test passed: generates data correctly using -c flag')
    });
  })
})
