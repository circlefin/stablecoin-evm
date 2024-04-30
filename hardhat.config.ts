/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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

import dotenv from "dotenv";

import type { HardhatUserConfig } from "hardhat/config";

// Hardhat extensions
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-foundry";
import "@nomiclabs/hardhat-truffle5";
import "@typechain/hardhat";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";

// Local hardhat scripts / tasks
import "./scripts/hardhat/downloadBlacklistedAccounts";
import "./scripts/hardhat/getContractCreationBlock";
import "./scripts/hardhat/readValuesFromContract";
import "./scripts/hardhat/validateAccountsToBlacklist";

import "./scripts/hardhat/verifyBytecodeOnChain";

dotenv.config();

// Defaults to 1.3 to be equivalent with Foundry
const gasMultiplier = process.env.GAS_MULTIPLIER
  ? parseFloat(process.env.GAS_MULTIPLIER) / 100
  : 1.3;

const hardhatConfig: HardhatUserConfig = {
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: parseInt(process.env.OPTIMIZER_RUNS || "10000000"),
      },
    },
  },
  paths: {
    artifacts: "./artifacts/hardhat",
    cache: "./cache/hardhat",
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    testnet: {
      url: process.env.TESTNET_RPC_URL || "",
      gasMultiplier,
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      gasMultiplier,
    },
  },
  typechain: {
    outDir: "./@types/generated",
    target: "truffle-v5",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["build/contracts/**/*.json"],
    dontOverrideCompile: false, // defaults to false
  },
  gasReporter: {
    enabled: process.env.ENABLE_GAS_REPORTER == "true",
  },
  mocha: {
    timeout: 60000, // prevents tests from failing when pc is under heavy load
    grep: process.env.HARDHAT_TEST_GREP,
    invert: process.env.HARDHAT_TEST_INVERT === "true",
    reporter: "mocha-multi-reporters",
    reporterOptions: {
      reporterEnabled:
        process.env.CI === "true" ? "spec, mocha-junit-reporter" : "spec",
      mochaJunitReporterReporterOptions: {
        mochaFile: "report/junit.xml",
      },
    },
  },
  contractSizer: {
    strict: true,
    except: ["contracts/test", "scripts/", "test/"],
  },
};

export default hardhatConfig;
