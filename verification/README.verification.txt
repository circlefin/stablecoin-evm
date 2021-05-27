The spreadsheet verification tool requires certain naming and usage conventions
to function correctly.

Unit test codes:

- Should follow the format of lowercase letters followed by a number with
  no spaces. (ex. pt001, ept016, misc0000, legacy2, fiat19)

- Should be included at the beginning of each test title (in the test suite)
  and each test description (in the spreadsheet).

- Should be listed under the 'Code' column of each spreadsheet tab.


CSV files:
- All CSV files must be in the `verification/Spreadsheets` directory.

- Each unit test contract block is associated with a single *.csv file.
  If the contract block title is 'FiatToken_EventTests' then it will be tested
  against FiatToken_EventTests.csv.  The verification tool will ignore all
  text in the contract block title after a space.  'FiatToken_EventTests Upgraded'
  will also be verified against FiatToken_EventTests.csv

- Should include a column 'code' or 'Code' listing all unique test codes that
  correspond to tests expected in the test file.

- Should include a column listing all unique test descriptions that correspond
  to tests expected in the test file. This column should be immediately to the
  right of the test code column and should be ordered such that the test code
  on any given row refers to the same test as the test description on that row.

- Should keep the column headers in the top row.

UnitTestCompleteness CSV (unsupported):

- The verification tool will print out any test codes that are featured in
  the UnitTestCompleteness tab but missing from the test suite.
- It does not matter where these codes are located in the tab so long as they
  adhere to the same code format used throughout the test suite.
  (i.e. xyz123, where xyz is a sequence of 2+ lowercase letters and 123 is any
  sequence of numbers)

Contract Block Titles:

- Must match the CSV file name that it is tested against (see CSV files above).

- Should include the word 'Legacy' if they run tests that do not need to be
  recorded in the spreadsheet and can be ignored by the verification tool.

Pending Tests:

- Should be flagged with ' -p' immediately after the test code in the
  spreadsheet. This flag should not be included anywhere in the test suite code
  or in the spreadsheet test description.
- The purpose of the pending flag is to mark tests that you are working on
  but have not yet merged. When other developers use the tool, it will ignore
  the tests that are marked pending rather than alert them that tests are
  missing from their test suite. When you, the developer writing the pending
  tests, use the tool it will simply list the tests you are working on.
  If the tool alerts you that there are tests marked as pending that are also
  included in your version of the test suite, but they are not tests you are
  working on, then the developer who wrote the tests forgot to delete the
  pending flags from the spreadsheet when the tests were merged, and you should
  go ahead and delete them yourself.


***Disabling/Enabling Verification***

- To DISABLE the spreadsheet verification tool, go to the file truffle.js and
  comment out the following line:
      reporter: 'verification/verification_reporter.js',
  Then, uncomment the line above it.
      //reporter: 'Spec',

- To ENABLE the spreadsheet verification tool FOR THE FIRST TIME.

  1) Ensure your browser is signed in to your Google account and visit
  https://developers.google.com/sheets/api/quickstart/nodejs .

  2) Press the blue 'ENABLE THE GOOGLE SHEETS API' button.

  3) Enter a project name (i.e. 'spreadsheet-verification') and product name
  (i.e 'centre-tokens') and download the credentials.json file.

  4) Move your credentials.json file into the verification/GoogleSheets folder.

  5) Run 'npm run truffle-test'. You should be prompted to visit a URL and enter a code
  that you find there into your terminal. This will create a token.json file
  inside the GoogleSheets folder. Note, if a token.json file already exists in
  this folder, you will encounter an error.

  From there, you should be good to go. This process only needs to be completed
  the first time you use the tool.

  Note: Ensure that credentials.json and token.json are included in .gitignore
  before committing.
