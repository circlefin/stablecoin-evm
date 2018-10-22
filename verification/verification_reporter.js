const util = require('util');
const mocha = require('mocha');
const spec_reporter = mocha.reporters.Spec;
const base_reporter = mocha.reporters.Base;
const color = base_reporter.color;
const inherits = mocha.utils.inherits;
const sheets = require('./spreadsheet_parser');
const _ = require('lodash');
const jsdiff = require('diff');
const colors = require('colors');

// Global variables for text output.
const red_x = color('bright fail', base_reporter.symbols.err);
const green_ok = color('green', base_reporter.symbols.ok);
const red_ok = color('bright fail', base_reporter.symbols.ok);
const indent = '    ';

module.exports = verification_reporter;

// Extends default Mocha reporter, 'Spec'.
inherits(verification_reporter, spec_reporter);

function verification_reporter (runner) {
  spec_reporter.call(this, runner);

  var spreadsheet;
  var missingUnitTests;
  var errs = [];
  var pending = {};
  var executedTestSuites = {};

  // Runs before tests are executed. Loads tests from spreadsheet.
  before('load_spreadsheet_tests', async function() {
    this.timeout(200000);
    console.log('Loading spreadsheet...\n');
    // need two copies of spreadsheet because some unit tests run multiple times
    spreadsheet = sheets.load();  // check if unit test is in spreadsheet at all
    missingUnitTests = sheets.load(); // reporter will remove codes once they're found
  });

  // Runs at the beginning of each contract block execution.
  runner.on('suite', function(suite) {
    // If contract block title is marked 'Legacy',
    // we skip verification. (See README.verification)
    var legacy = suite.title.match(/Legacy/gi);
    if (legacy) {
      console.log(indent +
        'This test file is marked "Legacy". Skipping verification.');
    }

    // We also skip verification on the 'PausableTests' file.
    // Remove this block and the one indicated below to re-enable.
    var pausable_tests = suite.title.match(/PausableTests/gi);
    if (pausable_tests) {
      console.log(indent +
        'Verification tool configured to skip PausableTests file.');
    }

  });

  // Runs at the end of every test.
  runner.on('test end', function (test) {
    // If contract block title is marked 'Legacy',
    // we skip verification. (See README.verification)
    var legacy = test.parent.title.match(/Legacy/gi);
    if (legacy) {
      return;
    }

    // We also skip verification on the 'PausableTests' file.
    // Remove this block and the one indicated above to re-enable.
    var pausable_tests = test.parent.title.match(/PausableTests/gi);
    if (pausable_tests) {
      return;
    }

    // Parse test title.
    var fullSuiteName = test.parent.title.replace('Contract:','').trim();
    var suite = fullSuiteName.split(" ", 1)[0].trim();
    executedTestSuites[suite]=true;

    var id = test.title.match(/([a-z]{2,})([0-9]+)/g);
    if (id) {
      id = id[0];
    } else {
      console.log(indent + color('pass',
      'Error parsing test title.\n'
      + indent + 'Confirm id is formatted correctly and included in test title.\n'
      + indent + '(See README.verification)'));
      return;
    }
    var test_ran = test.title.trim();

    // check if test is in a "completeness" unit test sheet
    // if it is, cross it off as found by deleting it
    for(var completeness_suite in missingUnitTests) {
        if(completeness_suite.match(/Completeness/)){
            if(missingUnitTests[completeness_suite][id]) {
                console.log("complete: " + id);
                delete missingUnitTests[completeness_suite][id];
            }
        }
    }


      // Verify test is in spreadsheet.
      if (spreadsheet[suite]) {
        let spreadsheet_test = spreadsheet[suite][id];
        if (spreadsheet_test) {

          // If test is marked pending in spreadsheet, record for later output.
          if(spreadsheet_test.pending) {
              console.log(indent + green_ok + color('green', ' pending'));
              if(! pending[suite]) {
                pending[suite] = {};
              }
              pending[suite][id] = test_ran;

          // If test descriptions match, mark green.
          } else if (spreadsheet_test.description == test_ran) {
            console.log(indent + green_ok);

          // If test is in spreadsheet, but descriptions don't match.
          } else {
            console.log(indent + red_x
              + color('fail',
              ' test description inconsistent with spreadsheet for '
              + id + ', ' + suite));
            console.log("s: " + spreadsheet_test.description);
            console.log("t: " + test_ran);
            // Print test description string diff.
            let diff = getStringDiff(test_ran, spreadsheet_test.description);
            console.log(indent + diff);
            errs.push(red_x + color('fail',
              ' Test descriptions do not match for '
              + id  + ', ' + suite)
              + '\n' + indent + 'In spreadsheet: ' + spreadsheet_test.description
              + '\n' + indent + 'In test suite:   ' + test_ran
              + '\n' + indent + 'Diff:           ' + diff);
          }
          // If test is included in spreadsheet, 'cross-off' by deleting.
          if (missingUnitTests[suite][id]) {
            delete missingUnitTests[suite][id];
          }
        } else {
          // If test is not in spreadsheet.
          console.log(indent + red_x
            + color('fail', ' '
            + id + ' missing from spreadsheet suite ' + suite));
          errs.push(red_x
            + color('fail', ' Test ' + id + ' missing from '
            + suite + ' spreadsheet suite.'));
            assert.equal(true, false);
        }
      } else {
        // If test file not found in directory.
        console.log(indent + red_x
          + color('fail', ' test suite ' + suite
          + ' does not match a spreadsheet in the Spreadsheets directory'));
        errs.push(red_x
          + color('fail', ' Test suite ' + suite
          + ' missing from Spreadsheets directory. Possible solutions:\n'
          + '1. Ensure test is listed in correct *.csv file.\n'
          + '2. Ensure the *.csv file name is included in the contract block title.\n'
          + '(See README.verification)'));
      }
  });

  // Runs at the end of test suite execution. Prints verification summary.
  runner.on('end', function () {
    console.log('\n\nSpreadsheet Verification Summary:\n');
    // If there are pending tests included in the test suite...
    if (!_.isEmpty(pending)) {
      console.log(color('green', 'Pending Tests:'));
      console.log('The following tests are included in the test suite, but\n'
      + 'marked pending in the spreadsheet (delete -p flag once merged): ');
      console.log(util.inspect(pending, { showHidden: false, depth: null }));
    }
    // Do not report tests that are missing from test suite but marked pending.
    for(var pendingsuite in pending) {
        for(var pendingID in pending[pendingsuite]) {
             delete missingUnitTests[pendingsuite][pendingID];
        }
    }

    // If all the tests in a tab are present, 'cross-off' tab by deleting.
    for(var testSuite in missingUnitTests) {
      if (_.isEmpty(missingUnitTests[testSuite])) {
        delete missingUnitTests[testSuite];
      }
    }

    // Report missing unit tests for files that were executed
    for(var testSuite in missingUnitTests){
        if(! _.has(executedTestSuites, testSuite)) {
            console.log(color('fail', 'Did not run: ' + testSuite));
            delete missingUnitTests[testSuite];
        }
    }

    // report missing Completeness unit tests ONLY if every test file ran
    var onlyCompletenessTestsAreMissing = true;
    for(var testSuite in missingUnitTests){
        if(! testSuite.match(/Completeness/))
            onlyCompletenessTestsAreMissing = false;
    }
    if(onlyCompletenessTestsAreMissing){
        for(var testSuite in missingUnitTests){
           console.log(color('fail', 'Did not run: ' + testSuite));
        }
    }

    // If all tests are 'crossed-off', print success.
    if (_.isEmpty(missingUnitTests)) {
      console.log('\n' + green_ok + color('green',
      ' Test run contains all tests in spreadsheet.'));
    } else {
      // If not all tests are 'crossed-off', print the tests remaining.
      console.log(color('bright fail',
      '\nThe following tests were not executed (but are included in a spreadsheet):\n'));
      console.log(util.inspect(missingUnitTests, { showHidden: false, depth: null }));
    }
  });
}


// Helper function that takes in two strings and returns a color coded diff.
function getStringDiff(string1, string2) {
  var diff = '';
  var diff_list = jsdiff.diffChars(string1, string2);
  diff_list.map((part) => {
    // green for additions, red for deletions, grey for common parts
    let color = part.added ? 'green' : part.removed ? 'red' : 'grey';
    diff += part.value[color];
  });
  return diff;
}
