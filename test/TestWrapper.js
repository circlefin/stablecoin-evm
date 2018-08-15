var tokenUtils = require('./TokenTestUtils');
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;


// The following helpers make fresh original/upgraded tokens before each test.

async function newToken() {
  var token = await FiatToken.new();
  return token;
}

async function newUpgradedToken() {
	var token = await UpgradedFiatToken.new();
	return token;
}

// Executes the run_tests_function using an original and
// an upgraded token.  The test_suite_name is printed standard output.
function execute(test_suite_name, run_tests_function) {
    contract(test_suite_name, async function (accounts) {
        await run_tests_function(newToken, accounts);
    });

    contract(test_suite_name + " Upgraded", async function (accounts) {
        await run_tests_function(newUpgradedToken, accounts);
    });

    return;
}

module.exports = {
    execute: execute
}
