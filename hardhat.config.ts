/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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

import "./scripts/hardhat/verifyOnChainBytecode";
import "@nomicfoundation/hardhat-verify";

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
    abstract: {
      url:
        process.env.RPC_URL_ABSTRACT_MAINNET || "https://api.mainnet.abs.xyz",
      gasMultiplier,
    },
    ape: {
      url: process.env.RPC_URL_APE_MAINNET || "https://apechain.drpc.org",
      gasMultiplier,
    },
    apexfusionnexus: {
      url:
        process.env.RPC_URL_APEXFUSIONNEXUS_MAINNET ||
        "https://rpc.nexus.mainnet.apexfusion.org",
      gasMultiplier,
    },
    bera: {
      url: process.env.RPC_URL_BERA_MAINNET || "https://rpc.berachain-apis.com",
      gasMultiplier,
    },
    botanix: {
      url: process.env.RPC_URL_BOTANIX_MAINNET || "https://rpc.botanixlabs.com",
      gasMultiplier,
    },
    camp: {
      url:
        process.env.RPC_URL_CAMP_MAINNET ||
        "https://rpc.camp.raas.gelato.cloud",
      gasMultiplier,
    },
    cronos: {
      url: process.env.RPC_URL_CRONOS_MAINNET || "https://rpc.stable.xyz",
      gasMultiplier,
    },
    degen: {
      url: process.env.RPC_URL_DEGEN_MAINNET || "https://rpc.degen.tips",
      gasMultiplier,
    },
    doma: {
      url: process.env.RPC_URL_DOMA_MAINNET || "https://doma.drpc.org",
      gasMultiplier,
    },
    edu: {
      url:
        process.env.RPC_URL_EDU_MAINNET ||
        "https://rpc.edu-chain.raas.gelato.cloud",
      gasMultiplier,
    },
    flow: {
      url:
        process.env.RPC_URL_FLOW_MAINNET ||
        "https://mainnet.evm.nodes.onflow.org",
      gasMultiplier,
    },
    fuse: {
      url: process.env.RPC_URL_FUSE_MAINNET || "https://rpc.fuse.io",
      gasMultiplier,
    },
    gatelayer: {
      url:
        process.env.RPC_URL_GATELAYER_MAINNET ||
        "https://gatelayer-mainnet.gatenode.cc",
      gasMultiplier,
    },
    glue: {
      url: process.env.RPC_URL_GLUE_MAINNET || "https://rpc.glue.net",
      gasMultiplier,
    },
    goat: {
      url: process.env.RPC_URL_GOAT_MAINNET || "https://rpc.goat.network",
      gasMultiplier,
    },
    hemi: {
      url:
        process.env.RPC_URL_HEMI_MAINNET ||
        "https://7e57304f.rpc.hemi.network/rpc",
      gasMultiplier,
    },
    horizen: {
      url:
        process.env.RPC_URL_HORIZEN_MAINNET ||
        "https://horizen.calderachain.xyz/http",
      gasMultiplier,
    },
    ink: {
      url: process.env.RPC_URL_INK_MAINNET || "https://rpc-gel.inkonchain.com",
      gasMultiplier,
    },
    islander: {
      url:
        process.env.RPC_URL_ISLANDER_MAINNET ||
        "https://evm-rpc-vana.josephtran.xyz",
      gasMultiplier,
    },
    moca: {
      url: process.env.RPC_URL_MOCA_MAINNET || "https://rpc.mocachain.org",
      gasMultiplier,
    },
    nibiru: {
      url: process.env.RPC_URL_NIBIRU_MAINNET || "https://evm-rpc.nibiru.fi",
      gasMultiplier,
    },
    og: {
      url: process.env.RPC_URL_OG_MAINNET || "https://evmrpc.0g.ai",
      gasMultiplier,
    },
    orderly: {
      url: process.env.RPC_URL_ORDERLY_MAINNET || "https://rpc.orderly.network",
      gasMultiplier,
    },
    peaq: {
      url: process.env.RPC_URL_PEAQ_MAINNET || "https://evm.peaq.network",
      gasMultiplier,
    },
    plumephoenix: {
      url: "https://phoenix-rpc.plumenetwork.xyz",
      gasMultiplier,
    },
    redbelly: {
      url:
        process.env.RPC_URL_REDBELLY_MAINNET ||
        "https://governors.mainnet.redbelly.network",
      gasMultiplier,
    },
    rootstock: {
      url:
        process.env.RPC_URL_ROOTSTOCK_MAINNET || "https://public-node.rsk.co",
      gasMultiplier,
    },
    somnia: {
      url: "https://api.infra.mainnet.somnia.network/",
      chainId: 5031,
    },
    stable: {
      url: process.env.RPC_URL_STABLE_MAINNET || "https://rpc.stable.xyz",
      gasMultiplier,
    },
    story: {
      url: process.env.RPC_URL_STORY_MAINNET || "https://mainnet.storyrpc.io",
      gasMultiplier,
    },
    superposition: {
      url:
        process.env.RPC_URL_SUPERPOSITION_MAINNET ||
        "https://rpc.superposition.so",
      gasMultiplier,
    },
    telos: {
      url: process.env.RPC_URL_TELOS_MAINNET || "https://rpc.telos.net",
      gasMultiplier,
    },
    xdc: {
      url: process.env.RPC_URL_XDC_MAINNET || "https://rpc1.xinfin.network",
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
  etherscan: {
    apiKey: {
      // Is not required by blockscout. Can be any non-empty string
      plumephoenix: "abc",
      somnia: "somnia",
    },
    customChains: [
      {
        network: "plumephoenix",
        chainId: 98866,
        urls: {
          apiURL: "https://phoenix-explorer.plumenetwork.xyz/api",
          browserURL: "https://phoenix-explorer.plumenetwork.xyz/",
        },
      },
      {
        network: "somnia",
        chainId: 5031,

        urls: {
          apiURL: "https://mainnet.somnia.w3us.site/api",
          browserURL: "https://mainnet.somnia.w3us.site",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default hardhatConfig;
