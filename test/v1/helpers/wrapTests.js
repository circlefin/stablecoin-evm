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

const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

// Executes the run_tests_function using an original and
// an upgraded token. The test_suite_name is printed standard output.
function wrapTests(testSuiteName, runTestsFunction) {
  contract(`FiatTokenV1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV1.new, accounts, 1);
  });

  contract(`FiatTokenV1_1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV1_1.new, accounts, 1.1);
  });

  contract(`FiatTokenV2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV2.new, accounts, 2);
  });

  contract(`FiatTokenV2_1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV2_1.new, accounts, 2.1);
  });

  contract(`FiatTokenV2_2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(FiatTokenV2_2.new, accounts, 2.2);
  });
}

module.exports = wrapTests;
