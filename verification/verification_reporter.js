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
const green_x = color('bright pass', base_reporter.symbols.err);
const red_x = color('bright fail', base_reporter.symbols.err);
const green_ok = color('bright pass', base_reporter.symbols.ok);
const red_ok = color('bright fail', base_reporter.symbols.ok);
const indent = '    ';

module.exports = verification_reporter;

// Extends default Mocha reporter, 'Spec'.
inherits(verification_reporter, spec_reporter);

function verification_reporter (runner) {
  spec_reporter.call(this, runner);

  var spreadsheet;
  var errs = [];
  var pending = {};

  // Runs before tests are executed. Loads tests from spreadsheet.
  before('load_spreadsheet_tests', async function() {
    this.timeout(200000);
    console.log('Loading spreadsheet...\n');
    spreadsheet = sheets.load();
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
  // TODO: upgraded tests "missing" because deleted from spreadsheet after first run
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
    var file = test.parent.title.match(/[a-z]+Tests/gi);
    if (file) {
      file = file[0];
    } else {
      console.log(indent + color('pass',
      'Error parsing test title.\n'
      + indent + 'Confirm file name is formatted correctly and included in contract \n'
      + indent + 'block title. (See README.verification)'));
      return;
    }
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
    var test_ran = test.title;
//    var test_ran = test.title.replace(id, '');

    // Check if test is in UnitTestCompleteness tab and "cross-off" if it is.
    /* TODO: implement UnitTestCompleteness spreadsheet processing
    if (!_.isEmpty(spreadsheet.completeness)) {
      if (spreadsheet.completeness[id]) {
        delete spreadsheet.completeness[id];
      }
    }
*/
      // Verify test is in spreadsheet.
      if (spreadsheet[file]) {
        let spreadsheet_test = spreadsheet[file][id];
        if (spreadsheet_test) {

          // If test is marked pending in spreadsheet, record for later output.
          if(spreadsheet_test.pending) {
              console.log(indent + green_x + color('bright pass', ' pending'));
              pending[id] = test_ran;

          // If test descriptions match, mark green.
          } else if (spreadsheet_test.description == test_ran) {
            console.log(indent + green_x);

          // If test is in spreadsheet, but descriptions don't match.
          } else {
            console.log(indent + red_x
              + color('fail',
              ' test description inconsistent with spreadsheet for '
              + id + ', ' + file));
            console.log("s: " + spreadsheet_test.description);
            console.log("t: " + test_ran);
            // Print test description string diff.
            let diff = getStringDiff(test_ran, spreadsheet_test.description);
            console.log(indent + diff);
            errs.push(red_x + color('fail',
              ' Test descriptions do not match for '
              + id  + ', ' + file)
              + '\n' + indent + 'In spreadsheet: ' + spreadsheet_test.description
              + '\n' + indent + 'In test file:   ' + test_ran
              + '\n' + indent + 'Diff:           ' + diff);
          }
          // If test is included in spreadsheet, 'cross-off' by deleting.
          if (spreadsheet[file][id]) {
            delete spreadsheet[file][id];
          }
        } else {
          // If test is not in spreadsheet.
          console.log(indent + red_x
            + color('fail', ' '
            + id + ' missing from spreadsheet file ' + file));
          errs.push(red_x
            + color('fail', ' Test ' + id + ' missing from '
            + file + ' spreadsheet file.'));
        }
      } else {
        // If test file not found in directory.
        console.log(indent + red_x
          + color('fail', ' test file ' + file
          + ' does not match a spreadsheet in the Spreadsheets directory'));
        errs.push(red_x
          + color('fail', ' Test file ' + file
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
      console.log(color('bright pass', 'Pending Tests:'));
      console.log('The following tests are included in the test suite, but\n'
      + 'marked pending in the spreadsheet (delete -p flag once merged): ');
      console.log(pending);
    }
    // TODO: fix pending
    // Do not report tests that are missing from test suite but marked pending.
 //   delete spreadsheet.pending;
    // Print out any tests that are included in UnitTestCompleteness tab but
    // missing from the test suite.
    // TODO: fix completeness spreadshet
 /*   if (!_.isEmpty(spreadsheet.completeness)) {
      console.log('\n' + red_x + color('bright fail',
      ' UnitTestCompleteness tab includes tests that are not present in test suite:')
      + '\n' + Object.keys(spreadsheet.completeness).toString());
    } else {
      console.log(green_ok + color('bright pass',
      ' Test suite suite contains all tests in UnitTestCompleteness tab.'));
    }
    delete spreadsheet.completeness;*/
    // If all the tests in a tab are present, 'cross-off' tab by deleting.
    for(var file in spreadsheet) {
      if (_.isEmpty(spreadsheet[file])) {
        delete spreadsheet[file];
      }
    }
    // If all tests are 'crossed-off', print success.
    if (_.isEmpty(spreadsheet)) {
      console.log('\n' + green_ok + color('bright pass',
      ' Test suite contains all tests in spreadsheet.'));
    } else {
      // If not all tests are 'crossed-off', print the tests remaining.
      console.log(color('bright fail',
      '\nTests missing from test suite (but included in spreadsheet):\n'));
      console.log(spreadsheet); // TODO: test this line works
    }
    // Print all errors where executed tests did not match spreadsheet.
    if (errs.length) {
      console.log(color('bright fail',
      '\nTests missing from spreadsheet (but included in test suite): '));
      errs.map((err) => {
        console.log('\n' + err);
      });
    } else {
      console.log('\n' + green_ok + color('bright pass',
      ' Spreadsheet contains all tests in test suite.'));
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
