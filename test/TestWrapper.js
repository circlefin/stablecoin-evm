const { UpgradedFiatToken, FiatToken } = require("./TokenTestUtils");

// The following helpers make fresh original/upgraded tokens before each test.

async function newToken() {
  const token = await FiatToken.new();
  return token;
}

async function newUpgradedToken() {
  const token = await UpgradedFiatToken.new();
  return token;
}

// Executes the run_tests_function using an original and
// an upgraded token. The test_suite_name is printed standard output.
function execute(test_suite_name, run_tests_function) {
  contract(test_suite_name, async (accounts) => {
    await run_tests_function(newToken, accounts);
  });

  contract(test_suite_name + " Upgraded", async (accounts) => {
    await run_tests_function(newUpgradedToken, accounts);
  });
}

module.exports = {
  execute,
};
