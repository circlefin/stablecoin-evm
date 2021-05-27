const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "/token.json");

/**
 * Authorize access to GoogleSheets API and load spreadsheet data.
 */
function load() {
  return new Promise((resolve, reject) => {
    // Load client secrets from a local file.
    fs.readFile(CREDENTIALS_PATH, async (err, content) => {
      if (err) {
        reject(new Error("Error loading credentials file:" + err));
      }
      // If no error loading client secrets, authorize and run getTests().
      const res = await authorize(JSON.parse(content), getTests).catch(
        (err) => {
          reject(err);
        }
      );
      resolve(res);
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  // eslint-disable-next-line camelcase
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  return new Promise((resolve, reject) => {
    // Check if we have previously stored an OAuth token.
    fs.readFile(TOKEN_PATH, async (err, token) => {
      // If we have not previously stored an OAuth token, get a new one and
      // call getTests().
      let res;
      if (err) {
        res = await getNewToken(oAuth2Client, callback).catch((err) => {
          reject(err);
        });
      } else {
        // If we have previously stored an OAuth token, call getTests().
        oAuth2Client.setCredentials(JSON.parse(token));
        res = await callback(oAuth2Client).catch((err) => {
          reject(err);
        });
      }
      resolve(res);
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, async (err, token) => {
        if (err) {
          reject(await callback(err));
        }
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) {
            console.error(err);
          }
          console.log("Token stored to", TOKEN_PATH);
        });
        const res = await callback(oAuth2Client).catch((err) => {
          reject(err);
        });
        resolve(res);
      });
    });
  });
}

/**
 * Gets the tests to verify from the GoogleSheets spreadsheet.
 * @see https://docs.google.com/spreadsheets/d/1zP1_q8XbLH8YrWMJ0Od80PKleklUnvBAX96wypJaVTU/edit?usp=sharing
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function getTests(auth) {
  const sheets = google.sheets({ version: "v4", auth });

  return new Promise((resolve, reject) => {
    sheets.spreadsheets.get(
      {
        spreadsheetId: "1zP1_q8XbLH8YrWMJ0Od80PKleklUnvBAX96wypJaVTU",
        includeGridData: true,
      },
      (err, res) => {
        if (err) {
          reject(new Error("The GoogleSheets API returned an error: " + err));
        }
        const tests = {};
        const tabs = res.data.sheets;
        if (tabs.length) {
          tabs.map((tab) => {
            const tabName = tab.properties.title;
            if (tabName === "UnitTestCompleteness") {
              loadUnitTestCompleteness(tests, tab);
              return;
            }
            const rows = tab.data[0].rowData;
            const topRow = rows.shift().values;
            const col = getCol(topRow);
            if (typeof col === "undefined") {
              console.log(
                '\nNo code column found in tab "' + tabName + '". Skipping.\n'
              );
              return;
            }
            rows.map((rowData) => {
              const row = rowData.values;
              if (row) {
                processRow(row, tabName, tests, col);
              }
            });
          });
        } else {
          reject(new Error("No GoogleSheets data found."));
        }
        resolve(tests);
      }
    );
  });
}

/**
 * Helper function that gets the test code and test description from a row in a
 * given speadsheet tab and adds them to the tests object returned by getTests().
 * @param {Array} row The row of the spreadsheet to processs.
 * @param {String} tabName The name of the spreadsheet tab currently loading.
 * @param {Object} tests Contains all the spreadsheet test data to verify.
 * @param {Int} col The index of the test code column of the spreadsheet tab.
 */
function processRow(row, tabName, tests, col) {
  const codeCell = row[col];
  const descCell = row[col + 1];
  if (codeCell && descCell) {
    let testCode = codeCell.formattedValue;
    const testDesc = descCell.formattedValue;
    if (testCode && testDesc) {
      const pending = testCode.match(/ -p/);
      if (pending) {
        testCode = testCode.replace(pending[0], "");
      }
      categorizeTest(
        tests,
        testCode.trim(),
        testDesc.trim(),
        tabName.trim(),
        pending
      );
    }
  }
}

/**
 * Helper function that gets all test codes included in tab UnitTestCompleteness.
 * @param {Object} tab The UnitTestCompleteness tab object.
 * @param {Object} tests Contains all the spreadsheet test data to verify.
 */
function loadUnitTestCompleteness(tests, tab) {
  tests.completeness = {};
  const rows = tab.data[0].rowData;
  rows.map((row) => {
    row = row.values;
    row.map((cell) => {
      cell = cell.formattedValue;
      if (cell) {
        const codes = cell.match(/([a-z]{2,})([0-9]+)/g);
        if (codes != null) {
          codes.map((code) => {
            if (!tests.completeness[code]) {
              tests.completeness[code] = true;
            }
          });
        }
      }
    });
  });
}

/**
 * Helper function that adds a test code and description to the tests object
 * returned by getTests().
 * @param {Object} tests Contains all the spreadsheet test data to verify.
 * @param {String} code The test code to add to tests.
 * @param {String} desc The test description to add to tests.
 * @param {String} tab The name of the spreadsheet tab currently loading.
 * @param {Array?} pending [' -p'] if test is pending, 'undefined' otherwise.
 */
function categorizeTest(tests, code, desc, tab, pending) {
  if (pending) {
    tab = "pending";
  }
  if (!tests[tab]) {
    tests[tab] = {};
  }
  const tabTests = tests[tab];
  tabTests[code] = desc.replace(code, "");
  tests[tab] = tabTests;
}

/**
 * Helper function that finds the 'Code' or 'code' column in a spreadsheet tab.
 * @param {Array} topRow An array containing all the cells along the top row of
 * the spreadsheet tab. Should contain column headers.
 */
function getCol(topRow) {
  let col;
  for (let i = 0; i < topRow.length; i++) {
    const cell = topRow[i];
    const label = cell.formattedValue;
    if (label === "code" || label === "Code") {
      col = i;
    }
  }
  return col;
}

module.exports = {
  load,
};
