/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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

import {
  AnyFiatTokenV2Instance,
  NativeFiatTokenV2_2InstanceExtended,
} from "../../../@types/AnyFiatTokenV2Instance";

import {
  behavesLikeNativeFiatTokenV22,
  deployMockNativeCoinAuthorityAtAddress,
  cleanupMockNativeCoinAuthority,
  deployMockNativeCoinControlAtAddress,
  cleanupMockNativeCoinControl,
} from "./NativeFiatTokenV2_2.behavior.test";
import { SignatureBytesType } from "../GasAbstraction/helpers";

import { initializeOverloadedMethods } from "../FiatTokenV2_2.test";
import { HARDHAT_ACCOUNTS } from "../../helpers/constants";
import { artifacts } from "hardhat";
import { linkLibraryToTokenContract } from "../../helpers";
import { behavesLikeFiatTokenV2 } from "../v2.behavior";
import { MockNativeFiatTokenWithExposedFunctionsInstance } from "../../../@types/generated/MockNativeFiatTokenWithExposedFunctions";
import { behavesLikeFiatTokenV22 } from "../v2_2.behavior";

// Contract artifacts
const NativeFiatTokenV2_2 = artifacts.require("NativeFiatTokenV2_2");
const MockNativeFiatTokenWithExposedFunctions = artifacts.require(
  "MockNativeFiatTokenWithExposedFunctions"
);

describe("NativeFiatTokenV2_2", () => {
  // Test constants
  const DECIMALS = 6;
  const [owner, masterMinter, pauser, blacklister] = HARDHAT_ACCOUNTS;
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9]; // Required for regression tests

  before(async () => {
    // Link libraries first - this is common preparation for all tests
    await linkLibraryToTokenContract(NativeFiatTokenV2_2);
    await linkLibraryToTokenContract(MockNativeFiatTokenWithExposedFunctions);
  });

  // --- NativeFiatToken SPECIFIC TESTS ---
  describe("NativeFiatToken V2_2 Specific Behavior", () => {
    // Primary token instance for NativeFiatToken specific behavior
    let nativeFiatTokenToken: NativeFiatTokenV2_2InstanceExtended;

    /**
     * Factory function to get correctly configured NativeFiatToken token instance
     */
    const getNativeFiatTokenToken = (
      signatureBytesType: SignatureBytesType
    ): (() => AnyFiatTokenV2Instance) => {
      return () => {
        initializeOverloadedMethods(nativeFiatTokenToken, signatureBytesType);
        return nativeFiatTokenToken;
      };
    };

    beforeEach(async () => {
      // Setup dedicated mock contracts for NativeFiatToken tests using hardhat_setCode
      const ccMockCoinAuthority = await deployMockNativeCoinAuthorityAtAddress();
      const ccMockCoinControl = await deployMockNativeCoinControlAtAddress();

      // --- Setup NativeFiatToken token ---
      nativeFiatTokenToken = (await NativeFiatTokenV2_2.new()) as NativeFiatTokenV2_2InstanceExtended;

      // Initialize NativeFiatToken token
      await nativeFiatTokenToken.initialize(
        "USD Coin",
        "USDC",
        "USD",
        DECIMALS,
        masterMinter,
        pauser,
        blacklister,
        owner
      );

      // Setup mock contracts for NativeFiatToken token
      await ccMockCoinAuthority.setAllowedOperator(
        nativeFiatTokenToken.address,
        true
      );
      await ccMockCoinControl.setAllowedOperator(
        nativeFiatTokenToken.address,
        true
      );
    });

    afterEach(async () => {
      await cleanupMockNativeCoinAuthority();
      await cleanupMockNativeCoinControl();
    });

    // Run the NativeFiatToken behavior tests
    behavesLikeNativeFiatTokenV22(
      getNativeFiatTokenToken(SignatureBytesType.Unpacked)
    );
  });

  // --- REGRESSION TESTS ---
  describe("Regression Tests", () => {
    // Separate token instance for regression tests
    let regressionToken: MockNativeFiatTokenWithExposedFunctionsInstance;

    /**
     * Factory function to get correctly configured regression token instance
     */
    const getRegressionToken = (
      signatureBytesType: SignatureBytesType
    ): (() => AnyFiatTokenV2Instance) => {
      return () => {
        initializeOverloadedMethods(regressionToken, signatureBytesType);
        return regressionToken;
      };
    };

    beforeEach(async () => {
      // Deploy fresh mock contracts for regression tests using hardhat_setCode
      const regMockCoinAuthority = await deployMockNativeCoinAuthorityAtAddress();
      const regMockCoinControl = await deployMockNativeCoinControlAtAddress();

      // --- Setup regression test token ---
      regressionToken = await MockNativeFiatTokenWithExposedFunctions.new();

      // Initialize regression token with standard roles mapping
      await regressionToken.initialize(
        "USD Coin",
        "USDC",
        "USD",
        DECIMALS,
        fiatTokenOwner, // masterMinter - must be HARDHAT_ACCOUNTS[9] for the behavior tests
        fiatTokenOwner, // pauser
        fiatTokenOwner, // blacklister
        fiatTokenOwner // owner - must be HARDHAT_ACCOUNTS[9] for the behavior tests
      );

      // Setup mock contracts for regression token
      await regMockCoinAuthority.setAllowedOperator(
        regressionToken.address,
        true
      );
      await regMockCoinControl.setAllowedOperator(
        regressionToken.address,
        true
      );

      // Verify the regression token setup
      expect(await regressionToken.owner()).to.equal(
        await regressionToken.masterMinter()
      );
      expect(await regressionToken.masterMinter()).to.equal(fiatTokenOwner);

      await regressionToken.initializeV2("USDC");
    });

    afterEach(async () => {
      await cleanupMockNativeCoinAuthority();
      await cleanupMockNativeCoinControl();
    });

    // Standard V2 regression tests
    describe("Standard V2 behavior", () => {
      behavesLikeFiatTokenV2(
        2.2,
        getRegressionToken(SignatureBytesType.Unpacked)
      );
    });

    // Standard V2.2 regression tests
    describe("Standard V2_2 behavior", () => {
      behavesLikeFiatTokenV22(getRegressionToken(SignatureBytesType.Packed));
    });
  });
});
