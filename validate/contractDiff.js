/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2023, Circle Internet Financial, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require("fs");
const chalk = require("chalk");
const diff = require("diff");

function readFileSync(filename) {
  return fs.readFileSync(filename, "utf8");
}

function getFilenamesFromCode(code) {
  // find all lines with prefix "// File:"
  const filenames = code.match(/\/\/\s*File:\s*\S+\n/gi);
  for (let i = 0; i < filenames.length; i++) {
    // remove prefix "// File: ".
    filenames[i] = filenames[i].replace(/\/\/\s*File:\s*/i, "");
    filenames[i] = filenames[i].replace(/\s+/i, "");

    // directory openzeppelin-solidity is inside node_modules
    if (filenames[i].match(/openzeppelin-solidity/)) {
      filenames[i] = "node_modules/" + filenames[i];
    }

    // directory zos-lib is inside node_modules
    if (filenames[i].match(/zos-lib/)) {
      filenames[i] = "node_modules/" + filenames[i];
    }

    // add ./ prefix
    filenames[i] = "./" + filenames[i];
    console.log(filenames[i]);
  }
  return filenames;
}

function createCodeFile(filenames) {
  let code = "";
  for (let i = 0; i < filenames.length; i++) {
    try {
      console.log("Reading file " + filenames[i]);
    } catch (err) {
      console.log("Could not read file " + filenames[i]);
      return "";
    }
    code = code + readFileSync(filenames[i]) + "\n";
  }
  return code;
}

function diffText(code1, code2) {
  const diffOutput = diff.diffTrimmedLines(code1, code2);
  for (let i = 0; i < diffOutput.length; i++) {
    const diffLine = diffOutput[i];
    if (diffLine.added) {
      process.stdout.write(chalk.green(`+ ${diffLine.value}`));
    } else if (diffLine.removed) {
      process.stdout.write(chalk.red(`- ${diffLine.value}`));
    }
  }
}

function removeExtraComments(code) {
  const modified = code.replace(/\/\/\s*File:\s*\S+\n/gi, "");
  return modified;
}

function validate(filename) {
  let code = readFileSync(filename);

  const filenames = getFilenamesFromCode(code);
  const expectedCode = createCodeFile(filenames);

  code = removeExtraComments(code);
  diffText(code, expectedCode);
}

function printUsage() {
  console.log("node contractDiff <file1> <file2> .... <fileN>");
}

function main() {
  if (process.argv.length < 3) {
    printUsage();
    return;
  }

  let fail = 0;
  const total = process.argv.length - 2;
  let goodFiles = "";
  let badFiles = "";

  for (let i = 2; i < process.argv.length; i++) {
    const filename = process.argv[i];
    console.log("Checking: " + filename);
    try {
      validate(filename);
      goodFiles = goodFiles + filename + "\n";
    } catch (err) {
      console.log("Error validating file " + filename);
      console.log(err.msg);
      badFiles = badFiles + filename + "\n";
      ++fail;
    }
  }

  if (total - fail > 0) {
    process.stdout.write(
      chalk.green("\n\nSuccessfully processed " + (total - fail) + " files.\n")
    );
    process.stdout.write(chalk.green(goodFiles));
  }

  if (fail > 0) {
    process.stdout.write(
      chalk.red("\n\nFailed to process " + fail + " files.\n")
    );
    process.stdout.write(chalk.red(badFiles + "\n"));
  }
}

main();
