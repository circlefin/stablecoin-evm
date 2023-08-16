const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

// Executes the run_tests_function using an original and
// an upgraded token. The test_suite_name is printed standard output.
function wrapTests(testSuiteName, runTestsFunction) {
  contract(`FiatTokenV1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV1.new, accounts, 1);
  });

  contract(`FiatTokenV1_1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV1_1.new, accounts, 1.1);
  });

  contract(`FiatTokenV2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV2.new, accounts, 2);
  });

  contract(`FiatTokenV2_1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV2_1.new, accounts, 2.1);
  });

  contract(`FiatTokenV2_2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV2_2.new, accounts, 2.2);
  });
}

module.exports = wrapTests;
