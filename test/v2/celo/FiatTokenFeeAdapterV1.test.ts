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

const FiatTokenFeeAdapterProxy = artifacts.require("FiatTokenFeeAdapterProxy");
const FiatTokenFeeAdapterV1 = artifacts.require("FiatTokenFeeAdapterV1");
const FiatTokenCeloV2_2 = artifacts.require("FiatTokenCeloV2_2");

import { BN } from "ethereumjs-util";
import { FiatTokenFeeAdapterV1Instance } from "../../../@types/generated";
import { FiatTokenCeloV2_2Instance } from "../../../@types/generated/FiatTokenCeloV2_2";
import {
  expectRevert,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../../helpers";
import { HARDHAT_ACCOUNTS } from "../../helpers/constants";

describe("FiatTokenFeeAdapterV1", () => {
  const tokenOwner = HARDHAT_ACCOUNTS[0];
  const adapterProxyAdmin = HARDHAT_ACCOUNTS[14];
  const additionalDecimals = 12;

  let feeAdapter: FiatTokenFeeAdapterV1Instance;
  let fiatToken: FiatTokenCeloV2_2Instance;

  let tokenDecimals: number, adapterDecimals: number;

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenCeloV2_2);
  });

  beforeEach(async () => {
    fiatToken = await FiatTokenCeloV2_2.new();
    await initializeToVersion(fiatToken, "2.2", tokenOwner, tokenOwner);

    tokenDecimals = (await fiatToken.decimals()).toNumber();
    adapterDecimals = tokenDecimals + additionalDecimals;

    const adapterImplementation = await FiatTokenFeeAdapterV1.new();
    const adapterProxy = await FiatTokenFeeAdapterProxy.new(
      adapterImplementation.address
    );
    await adapterProxy.changeAdmin(adapterProxyAdmin);
    feeAdapter = await FiatTokenFeeAdapterV1.at(adapterProxy.address);
  });

  describe("onlyCeloVm", () => {
    const errorMessage = "FiatTokenFeeAdapterV1: caller is not VM";

    it("should fail to call debitGasFees when caller is not 0x0", async () => {
      await feeAdapter.initializeV1(fiatToken.address, adapterDecimals);
      await expectRevert(feeAdapter.debitGasFees(tokenOwner, 1), errorMessage);
    });

    it("should fail to call creditGasFees when caller is not 0x0", async () => {
      await feeAdapter.initializeV1(fiatToken.address, adapterDecimals);
      await expectRevert(
        feeAdapter.creditGasFees(
          tokenOwner,
          tokenOwner,
          tokenOwner,
          tokenOwner,
          1,
          1,
          1,
          1
        ),
        errorMessage
      );
    });
  });

  describe("initializeV1", () => {
    const decimalsError =
      "FiatTokenFeeAdapterV1: Token decimals must be < adapter decimals";
    const digitDifferenceError =
      "FiatTokenFeeAdapterV1: Digit difference too large";

    it("should fail to initialize again", async () => {
      await feeAdapter.initializeV1(fiatToken.address, adapterDecimals);
      await expectRevert(feeAdapter.initializeV1(fiatToken.address, 1));
    });

    it("should fail to initialize if digit difference can overflow", async () => {
      await expectRevert(
        feeAdapter.initializeV1(
          fiatToken.address,
          (await fiatToken.decimals()).add(new BN(100))
        ),
        digitDifferenceError
      );
    });

    it("should fail when token has same decimals as adapter (redundant)", async () => {
      await expectRevert(
        feeAdapter.initializeV1(
          fiatToken.address,
          (await fiatToken.decimals()).toNumber()
        ),
        decimalsError
      );
    });

    it("should fail when token has more decimals than adapter", async () => {
      await expectRevert(
        feeAdapter.initializeV1(
          fiatToken.address,
          (await fiatToken.decimals()).toNumber() - 1
        ),
        decimalsError
      );
    });
  });

  describe("balanceOf", () => {
    it("should return upscaled balance", async () => {
      await feeAdapter.initializeV1(fiatToken.address, adapterDecimals);

      const value = 1e6;
      await fiatToken.configureMinter(tokenOwner, value);
      await fiatToken.mint(tokenOwner, value, { from: tokenOwner });
      expect((await fiatToken.balanceOf(tokenOwner)).toNumber()).to.equal(
        value
      );
      expect((await feeAdapter.balanceOf(tokenOwner)).toString()).to.equal(
        // The adapter should have padded the balance by the additional number
        // of decimals needed (adapter decimals - token decimals).
        (value * 10 ** additionalDecimals).toString()
      );
    });
  });
});
