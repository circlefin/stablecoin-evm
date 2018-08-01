const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const CREDENTIALS_PATH = __dirname + '/credentials.json';
const TOKEN_PATH = __dirname + '/token.json';

var indent = '    ';


/**
* Authorize access to GoogleSheets API and load spreadsheet data.
*/
function load() {
  return new Promise((resolve, reject) => {
    // Load client secrets from a local file.
    fs.readFile(CREDENTIALS_PATH, async (err, content) => {
      if (err) {
        reject('Error loading credentials file:' + err);
      }
      // If no error loading client secrets, authorize and run getTests().
      var res = await authorize(JSON.parse(content), getTests).catch((err) => {
        reject(err);
      });
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
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  return new Promise((resolve, reject) => {
    // Check if we have previously stored an OAuth token.
    fs.readFile(TOKEN_PATH, async (err, token) => {
      // If we have not previously stored an OAuth token, get a new one and
      // call getTests().
      if (err) {
        var res = await getNewToken(oAuth2Client, callback).catch((err) => {
          reject(err);
        });
      } else {
        // If we have previously stored an OAuth token, call getTests().
        oAuth2Client.setCredentials(JSON.parse(token));
        var res = await callback(oAuth2Client).catch((err) => {
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
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
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
          console.log('Token stored to', TOKEN_PATH);
        });
        var res = await callback(oAuth2Client).catch((err) => {
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
  const sheets = google.sheets({version: 'v4', auth});

  return new Promise((resolve, reject) => {
    sheets.spreadsheets.get({
      spreadsheetId: '1zP1_q8XbLH8YrWMJ0Od80PKleklUnvBAX96wypJaVTU',
      includeGridData: true,
    }, (err, res) => {
      if (err) {
        reject('The GoogleSheets API returned an error: ' + err);
      }
      var tests = {};
      let tabs = res.data.sheets;
      if (tabs.length) {
        tabs.map((tab) => {
          let tab_name = tab.properties.title;
          if (tab_name == 'UnitTestCompleteness') {
            load_UnitTestCompleteness(tests, tab);
            return;
          }
          let rows = tab.data[0].rowData;
          let top_row = rows.shift().values;
          let col = getCol(top_row);
          if (typeof col == 'undefined') {
            console.log('\nNo code column found in tab "'
            + tab_name + '". Skipping.\n');
            return;
          }
          rows.map((rowData) => {
            let row = rowData.values;
            if (row) {
              processRow(row, tab_name, tests, col);
            }
          });
        });
      } else {
        reject('No GoogleSheets data found.');
      }
      resolve(tests);
    });
  });
}


/**
* Helper function that gets the test code and test description from a row in a
* given speadsheet tab and adds them to the tests object returned by getTests().
* @param {Array} row The row of the spreadsheet to processs.
* @param {String} tab_name The name of the spreadsheet tab currently loading.
* @param {Object} tests Contains all the spreadsheet test data to verify.
* @param {Int} col The index of the test code column of the spreadsheet tab.
*/
function processRow(row, tab_name, tests, col) {
  let code_cell = row[col];
  let desc_cell = row[col+1];
  if (code_cell && desc_cell) {
    let test_code = code_cell.formattedValue;
    let test_desc = desc_cell.formattedValue;
    if (test_code && test_desc) {
          let pending = test_code.match(/ -p/);
          if (pending) {
            test_code = test_code.replace(pending[0], '');
          }
          categorize_test(
            tests,
            test_code.trim(),
            test_desc.trim(),
            tab_name.trim(),
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
function load_UnitTestCompleteness(tests, tab) {
  tests.completeness = {};
  let rows = tab.data[0].rowData;
  rows.map((row) => {
    row = row.values;
    row.map((cell) => {
      cell = cell.formattedValue;
      if (cell) {
        let codes = cell.match(/([a-z]{2,})([0-9]+)/g);
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
function categorize_test(tests, code, desc, tab, pending) {
  if (pending) {
    tab = 'pending';
  }
  if (!tests[tab]) {
    tests[tab] = {};
  }
  let tab_tests = tests[tab];
  tab_tests[code] = desc.replace(code, '');
  tests[tab] = tab_tests;
}


/**
* Helper function that finds the 'Code' or 'code' column in a spreadsheet tab.
* @param {Array} top_row An array containing all the cells along the top row of
* the spreadsheet tab. Should contain column headers.
*/
function getCol(top_row) {
  var col;
  for (let i = 0; i < top_row.length; i++) {
    let cell = top_row[i];
    let label = cell.formattedValue;
    if(label == 'code' || label == 'Code') {
      col = i;
    }
  }
  return col;
}

module.exports = {
  load: load,
}
