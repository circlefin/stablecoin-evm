const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

// The following helpers make fresh original/upgraded tokens before each test.

function newFiatTokenV1() {
  return FiatTokenV1.new();
}

function newFiatTokenV1_1() {
  return FiatTokenV1_1.new();
}

function newFiatTokenV2() {
  return FiatTokenV2.new();
}

function newFiatTokenV2_2() {
  return FiatTokenV2_2.new();
}

// Executes the run_tests_function using an original and
// an upgraded token. The test_suite_name is printed standard output.
function wrapTests(testSuiteName, runTestsFunction) {
  contract(`FiatTokenV1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV1, accounts, 1);
  });

  contract(`FiatTokenV1_1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV1_1, accounts, 1.1);
  });

  contract(`FiatTokenV2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV2, accounts, 2);
  });

  contract(`FiatTokenV2_2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV2_2, accounts, 2.2);
  });
}

module.exports = wrapTests;
