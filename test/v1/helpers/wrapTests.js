/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { linkLibraryToTokenContract } = require("../../helpers");

const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

// Executes the run_tests_function using an original and
// an upgraded token. The test_suite_name is printed standard output.
function wrapTests(testSuiteName, runTestsFunction) {
  describe(`FiatTokenV1: ${testSuiteName}`, () => {
    runTestsFunction(FiatTokenV1.new, 1);
  });

  describe(`FiatTokenV1_1: ${testSuiteName}`, () => {
    runTestsFunction(FiatTokenV1_1.new, 1.1);
  });

  describe(`FiatTokenV2: ${testSuiteName}`, () => {
    before(async () => {
      await linkLibraryToTokenContract(FiatTokenV2);
    });
    runTestsFunction(FiatTokenV2.new, 2);
  });

  describe(`FiatTokenV2_1: ${testSuiteName}`, () => {
    before(async () => {
      await linkLibraryToTokenContract(FiatTokenV2_1);
    });
    runTestsFunction(FiatTokenV2_1.new, 2.1);
  });

  describe(`FiatTokenV2_2: ${testSuiteName}`, () => {
    before(async () => {
      await linkLibraryToTokenContract(FiatTokenV2_2);
    });
    runTestsFunction(FiatTokenV2_2.new, 2.2);
  });
}

module.exports = wrapTests;
