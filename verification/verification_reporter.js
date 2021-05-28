const mocha = require("mocha");
const specReporter = mocha.reporters.Spec;
const baseReporter = mocha.reporters.Base;
const { color } = baseReporter;
const { inherits } = mocha.utils;
const sheets = require("./GoogleSheets/index");
const _ = require("lodash");
const jsdiff = require("diff");

// Global variables for text output.
const greenX = color("bright pass", baseReporter.symbols.err);
const redX = color("bright fail", baseReporter.symbols.err);
const greenOk = color("bright pass", baseReporter.symbols.ok);
// const redOk = color("bright fail", baseReporter.symbols.ok);
const indent = "    ";

module.exports = verificationReporter;

// Extends default Mocha reporter, 'Spec'.
inherits(verificationReporter, specReporter);

function verificationReporter(runner) {
  specReporter.call(this, runner);

  let spreadsheet;
  let spreadsheetClone;
  const errs = [];
  const pending = {};

  // Runs before tests are executed. Loads tests from spreadsheet.
  before("load_spreadsheetTests", async () => {
    this.timeout(200000);
    console.log("Loading spreadsheet...\n");
    spreadsheet = await sheets.load().catch((err) => {
      console.log(err);
    });
    spreadsheetClone = JSON.parse(JSON.stringify(spreadsheet));
  });

  // Runs at the beginning of each contract block execution.
  runner.on("suite", (suite) => {
    // If contract block title is marked 'Legacy',
    // we skip verification. (See README.verification)
    const legacy = suite.title.match(/Legacy/gi);
    if (legacy) {
      console.log(
        indent + 'This test file is marked "Legacy". Skipping verification.'
      );
    }

    // We also skip verification on the 'PausableTests' file.
    // Remove this block and the one indicated below to re-enable.
    const pausableTests = suite.title.match(/PausableTests/gi);
    if (pausableTests) {
      console.log(
        indent + "Verification tool configured to skip PausableTests file."
      );
    }
  });

  // Runs at the end of every test.
  runner.on("test end", (test) => {
    // If contract block title is marked 'Legacy',
    // we skip verification. (See README.verification)
    const legacy = test.parent.title.match(/Legacy/gi);
    if (legacy) {
      return;
    }

    // We also skip verification on the 'PausableTests' file.
    // Remove this block and the one indicated above to re-enable.
    const pausableTests = test.parent.title.match(/PausableTests/gi);
    if (pausableTests) {
      return;
    }

    // Parse test title.
    let file = test.parent.title.match(/[a-z]+Tests/gi);
    if (file) {
      file = file[0];
    } else {
      console.log(
        indent +
          color(
            "pass",
            "Error parsing test title.\n" +
              indent +
              "Confirm file name is formatted correctly and included in contract \n" +
              indent +
              "block title. (See README.verification)"
          )
      );
      return;
    }
    let id = test.title.match(/([a-z]{2,})([0-9]+)/g);
    if (id) {
      id = id[0];
    } else {
      console.log(
        indent +
          color(
            "pass",
            "Error parsing test title.\n" +
              indent +
              "Confirm id is formatted correctly and included in test title.\n" +
              indent +
              "(See README.verification)"
          )
      );
      return;
    }
    const testRan = test.title.replace(id, "");

    // Check if test is in UnitTestCompleteness tab and "cross-off" if it is.
    if (!_.isEmpty(spreadsheet.completeness)) {
      if (spreadsheet.completeness[id]) {
        delete spreadsheet.completeness[id];
      }
    }

    // If test is marked pending in spreadsheet, record for later output.
    if (spreadsheet.pending && spreadsheet.pending[id] === testRan) {
      console.log(indent + greenX + color("bright pass", " pending"));
      pending[id] = testRan;
    } else {
      // Verify test is in spreadsheet.
      if (spreadsheet[file]) {
        const spreadsheetTest =
          spreadsheet[file][id] || spreadsheetClone[file][id];
        if (spreadsheetTest) {
          // Verify test descriptions match.
          if (spreadsheetTest === testRan) {
            console.log(indent + greenX);
          } else {
            // If test is in spreadsheet, but descriptions don't match.
            console.log(
              indent +
                redX +
                color(
                  "fail",
                  " test description inconsistent with spreadsheet for " +
                    id +
                    ", " +
                    file
                )
            );
            // Print test description string diff.
            const diff = getStringDiff(testRan, spreadsheetTest);
            console.log(indent + diff);
            errs.push(
              redX +
                color(
                  "fail",
                  " Test descriptions do not match for " + id + ", " + file
                ) +
                "\n" +
                indent +
                "In spreadsheet: " +
                spreadsheetTest +
                "\n" +
                indent +
                "In test file:   " +
                testRan +
                "\n" +
                indent +
                "Diff:           " +
                diff
            );
          }
          // If test is included in spreadsheet, 'cross-off' by deleting.
          if (spreadsheet[file][id]) {
            delete spreadsheet[file][id];
          }
        } else {
          // If test is not in spreadsheet.
          console.log(
            indent +
              redX +
              color("fail", " " + id + " missing from spreadsheet tab " + file)
          );
          errs.push(
            redX +
              color(
                "fail",
                " Test " + id + " missing from " + file + " spreadsheet tab."
              )
          );
        }
      } else {
        // If test file not found in spreadsheet tabs.
        console.log(
          indent +
            redX +
            color(
              "fail",
              " test file " + file + " does not match a spreadsheet tab"
            )
        );
        errs.push(
          redX +
            color(
              "fail",
              " Test file " +
                file +
                " missing from spreadsheet. Possible solutions:\n" +
                "1. Ensure test is listed in correct spreadsheet tab.\n" +
                "2. Ensure the tab name is included in the contract block title.\n" +
                "(See README.verification)"
            )
        );
      }
    }
  });

  // Runs at the end of test suite execution. Prints verification summary.
  runner.on("end", () => {
    console.log("\n\nSpreadsheet Verification Summary:\n");
    // If there are pending tests included in the test suite...
    if (!_.isEmpty(pending)) {
      console.log(color("bright pass", "Pending Tests:"));
      console.log(
        "The following tests are included in the test suite, but\n" +
          "marked pending in the spreadsheet (delete -p flag once merged): "
      );
      console.log(pending);
    }
    // Do not report tests that are missing from test suite but marked pending.
    delete spreadsheet.pending;
    // Print out any tests that are included in UnitTestCompleteness tab but
    // missing from the test suite.
    if (!_.isEmpty(spreadsheet.completeness)) {
      console.log(
        "\n" +
          redX +
          color(
            "bright fail",
            " UnitTestCompleteness tab includes tests that are not present in test suite:"
          ) +
          "\n" +
          Object.keys(spreadsheet.completeness).toString()
      );
    } else {
      console.log(
        greenOk +
          color(
            "bright pass",
            " Test suite suite contains all tests in UnitTestCompleteness tab."
          )
      );
    }
    delete spreadsheet.completeness;
    // If all the tests in a tab are present, 'cross-off' tab by deleting.
    for (const file in spreadsheet) {
      if (_.isEmpty(spreadsheet[file])) {
        delete spreadsheet[file];
      }
    }
    // If all tests are 'crossed-off', print success.
    if (_.isEmpty(spreadsheet)) {
      console.log(
        "\n" +
          greenOk +
          color("bright pass", " Test suite contains all tests in spreadsheet.")
      );
    } else {
      // If not all tests are 'crossed-off', print the tests remaining.
      console.log(
        color(
          "bright fail",
          "\nTests missing from test suite (but included in spreadsheet):\n"
        )
      );
      console.log(spreadsheet);
    }
    // Print all errors where executed tests did not match spreadsheet.
    if (errs.length) {
      console.log(
        color(
          "bright fail",
          "\nTests missing from spreadsheet (but included in test suite): "
        )
      );
      errs.map((err) => {
        console.log("\n" + err);
      });
    } else {
      console.log(
        "\n" +
          greenOk +
          color("bright pass", " Spreadsheet contains all tests in test suite.")
      );
    }
  });
}

// Helper function that takes in two strings and returns a color coded diff.
function getStringDiff(string1, string2) {
  let diff = "";
  const diffList = jsdiff.diffChars(string1, string2);
  diffList.map((part) => {
    // green for additions, red for deletions, grey for common parts
    const col = part.added ? "green" : part.removed ? "red" : "grey";
    diff += part.value[col];
  });
  return diff;
}
