const mocha = require('mocha');
const spec_reporter = mocha.reporters.Spec;
const base_reporter = mocha.reporters.Base;
const color = base_reporter.color;
const inherits = mocha.utils.inherits;
const sheets = require('./GoogleSheets/index');
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
    spreadsheet = await sheets.load().catch((err) => {
      console.log(err);
    });
  });

  // Runs at the beginning of each contract block execution.
  runner.on('suite', function(suite) {
    // If contract block title is marked 'Upgraded' or 'Legacy',
    // we skip verification. (See README.verification)
    var upgraded = suite.title.match(/Upgraded/gi);
    var legacy = suite.title.match(/Legacy/gi);
    if (upgraded) {
      console.log(indent +
        'This test file is marked "Upgraded". Skipping verification.');
    }
    if (legacy) {
      console.log(indent +
        'This test file is marked "Legacy". Skipping verification.');
    }
  });

  // Runs at the end of every test.
  runner.on('test end', function (test) {
    // If contract block title is marked 'Upgraded' or 'Legacy',
    // we skip verification. (See README.verification)
    var upgraded = test.parent.title.match(/Upgraded/gi);
    var legacy = test.parent.title.match(/Legacy/gi);
    if (upgraded || legacy) {
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
    var test_ran = test.title.replace(id, '');

    // If test is marked pending in spreadsheet, record for later output.
    if (spreadsheet.pending && (spreadsheet.pending[id] == test_ran)) {
      console.log(indent + green_x + color('bright pass', ' pending'));
      pending[id] = test_ran;
    } else {
      // Verify test is in spreadsheet.
      if (spreadsheet[file]) {
        let spreadsheet_test = spreadsheet[file][id];
        if (spreadsheet_test) {
          // Verify test descriptions match.
          if (spreadsheet_test == test_ran) {
            console.log(indent + green_x);
          } else {
            // If test is in spreadsheet, but descriptions don't match.
            console.log(indent + red_x
              + color('fail',
              ' test description inconsistent with spreadsheet for '
              + id + ', ' + file));
            // Print test description string diff.
            let diff = getStringDiff(test_ran, spreadsheet_test);
            console.log(indent + diff);
            errs.push(red_x + color('fail',
              ' Test descriptions do not match for '
              + id  + ', ' + file)
              + '\n' + indent + 'In spreadsheet: ' + spreadsheet_test
              + '\n' + indent + 'In test file:   ' + test_ran
              + '\n' + indent + 'Diff:           ' + diff);
          }
          // If test is included in spreadsheet, 'cross-off' by deleting.
          delete spreadsheet[file][id];
        } else {
          // If test is not in spreadsheet.
          console.log(indent + red_x
            + color('fail', ' '
            + id + ' missing from spreadsheet tab ' + file));
          errs.push(red_x
            + color('fail', ' Test ' + id + ' missing from '
            + file + ' spreadsheet tab.'));
        }
      } else {
        // If test file not found in spreadsheet tabs.
        console.log(indent + red_x
          + color('fail', ' test file ' + file
          + ' does not match a spreadsheet tab'));
        errs.push(red_x
          + color('fail', ' Test file ' + file
          + ' missing from spreadsheet. Possible solutions:\n'
          + '1. Ensure test is listed in correct spreadsheet tab.\n'
          + '2. Ensure the tab name is included in the contract block title.\n'
          + '(See README.verification)'));
      }
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
    // Do not report tests that are missing from test suite but marked pending.
    delete spreadsheet.pending;
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
      console.log(spreadsheet);
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
