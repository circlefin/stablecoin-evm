const ECRecover = artifacts.require("ECRecover");
const EIP712 = artifacts.require("EIP712");
const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");

// The following helpers make fresh original/upgraded tokens before each test.

async function newFiatTokenV1() {
  const token = await FiatTokenV1.new();
  return token;
}

async function newFiatTokenV1_1() {
  const token = await FiatTokenV1_1.new();
  return token;
}

async function newFiatTokenV2() {
  const ecRecover = await ECRecover.new();
  EIP712.link("ECRecover", ecRecover.address);

  const eip712 = await EIP712.new();
  FiatTokenV2.link("EIP712", eip712.address);

  const token = await FiatTokenV2.new();
  return token;
}

// Executes the run_tests_function using an original and
// an upgraded token. The test_suite_name is printed standard output.
function wrapTests(testSuiteName, runTestsFunction) {
  contract(`FiatTokenV1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV1, accounts);
  });

  contract(`FiatTokenV1_1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV1_1, accounts);
  });

  contract(`FiatTokenV2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV2, accounts);
  });
}

module.exports = wrapTests;
