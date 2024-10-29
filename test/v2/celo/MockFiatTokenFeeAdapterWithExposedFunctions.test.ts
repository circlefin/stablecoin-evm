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

const MockFiatTokenFeeAdapterWithExposedFunctions = artifacts.require(
  "MockFiatTokenFeeAdapterWithExposedFunctions"
);
const FiatTokenCeloV2_2 = artifacts.require("FiatTokenCeloV2_2");

import { BN } from "ethereumjs-util";
import { MockFiatTokenFeeAdapterWithExposedFunctionsInstance } from "../../../@types/generated";
import { FiatTokenCeloV2_2Instance } from "../../../@types/generated/FiatTokenCeloV2_2";
import {
  expectRevert,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../../helpers";
import {
  HARDHAT_ACCOUNTS,
  MAX_UINT256_BN,
  POW_2_255_MINUS1_HEX,
  ZERO_ADDRESS,
} from "../../helpers/constants";

describe("MockFiatTokenFeeAdapterWithExposedFunctions", () => {
  const vm = HARDHAT_ACCOUNTS[0];
  // BN doesn't play nicely with scientific notation, so use string constructors instead.
  // This debit amount will be downscaled appropriately to the token.
  const debitAmount = new BN("1000000000000000000"); // 1e18
  const mintAmount = new BN("1000000000000000000000000"); // 1e24

  const owner = HARDHAT_ACCOUNTS[1];
  const from = HARDHAT_ACCOUNTS[2];

  const additionalDecimals = 12;

  let feeAdapter: MockFiatTokenFeeAdapterWithExposedFunctionsInstance;
  let fiatToken: FiatTokenCeloV2_2Instance;

  let tokenDecimals: number, adapterDecimals: number;

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenCeloV2_2);
  });

  beforeEach(async () => {
    fiatToken = await FiatTokenCeloV2_2.new();
    // This initializes with 6 decimals.
    await initializeToVersion(fiatToken, "2.2", owner, owner);
    await fiatToken.configureMinter(owner, POW_2_255_MINUS1_HEX, {
      from: owner,
    });
    // Set up some funds ahead of time.
    await fiatToken.mint(from, mintAmount, { from: owner });

    tokenDecimals = (await fiatToken.decimals()).toNumber();
    adapterDecimals = tokenDecimals + additionalDecimals;

    // Set up the adapter.
    feeAdapter = await MockFiatTokenFeeAdapterWithExposedFunctions.new();
    await feeAdapter.initializeV1(fiatToken.address, adapterDecimals);
    await feeAdapter.setVmCallerAddress(vm);

    // Make sure we can actually start the call chain through the adapter.
    await fiatToken.updateFeeCaller(feeAdapter.address, { from: owner });
  });

  describe("_upscale", () => {
    it("should return proper upscaled value", async () => {
      const valueUpscaled = await feeAdapter.internal_upscale(1 ** 0);
      expect(valueUpscaled.toNumber()).to.equal(10 ** additionalDecimals);
    });

    it("should revert upscaling when overflowed", async () => {
      await expectRevert(
        feeAdapter.internal_upscale(MAX_UINT256_BN),
        "SafeMath: multiplication overflow"
      );
    });
  });

  describe("_downscale", () => {
    it("should return proper downscaled value", async () => {
      // Web3JS doesn't play nice with very large raw number variables;
      // passing a nonstring here will result in an error.
      const value = (10 ** adapterDecimals).toString();
      const valueDownscaled = await feeAdapter.internal_downscale(value);
      expect(valueDownscaled.toNumber()).to.equal(
        10 ** (adapterDecimals - additionalDecimals)
      );
    });

    it("should return zero if value is small enough", async () => {
      // Since this value has less additional decimals added, it should
      // be stripped down to 0.
      const value = 10 ** (additionalDecimals - 1);
      expect((await feeAdapter.internal_downscale(value)).toNumber()).to.equal(
        0
      );
    });
  });

  describe("debitGasFees", () => {
    it("should debit with correct fee caller address", async () => {
      const balanceInitialFrom = await fiatToken.balanceOf(from);
      const balanceInitialFromUpscaled = await feeAdapter.balanceOf(from);

      const debitAmountDownscaled = debitAmount.divRound(
        new BN(10).pow(new BN(additionalDecimals))
      );

      await feeAdapter.debitGasFees(from, debitAmount, { from: vm });
      // Triple-compare: both contracts store the true debited value.
      expect((await feeAdapter.internal_debitedValue()).toString())
        .to.equal(debitAmountDownscaled.toString())
        .to.equal(
          web3.utils.hexToNumberString(
            await web3.eth.getStorageAt(
              fiatToken.address,
              // FiatTokenCeloV2_2#DEBITED_VALUE_SLOT Keccak256 hash.
              "0xd90dccaa76fe7208f2f477143b6adabfeb5d4a5136982894dfc51177fa8eda28"
            )
          )
        );

      // Assert balances affected.
      expect((await feeAdapter.balanceOf(from)).toString()).to.equal(
        balanceInitialFromUpscaled.sub(debitAmount).toString()
      );
      expect((await fiatToken.balanceOf(from)).toString()).to.equal(
        balanceInitialFrom.sub(debitAmountDownscaled).toString()
      );
      expect((await fiatToken.balanceOf(ZERO_ADDRESS)).toString()).to.equal(
        debitAmountDownscaled.toString()
      );
    });

    it("should fail to debit again", async () => {
      await feeAdapter.debitGasFees(from, debitAmount, {
        from: vm,
      });
      await expectRevert(
        feeAdapter.debitGasFees(from, debitAmount, {
          from: vm,
        }),
        "FiatTokenFeeAdapterV1: Must fully credit before debit"
      );
    });
  });

  describe("creditGasFees", () => {
    it("should should credit with no rounding error after debit", async () => {
      const debitAmount = new BN("200000000000000000000000");
      const refund = new BN("100000000000000000000000");
      const tipTxFee = new BN("90000000000000000000000");
      const baseTxFee = new BN("10000000000000000000000");

      const fromBalancePre = await feeAdapter.balanceOf(from);
      await feeAdapter.debitGasFees(from, debitAmount, { from: vm });
      await feeAdapter.creditGasFees(
        from,
        from,
        from,
        from,
        refund,
        tipTxFee,
        0,
        baseTxFee,
        { from: vm }
      );
      const fromBalancePost = await feeAdapter.balanceOf(from);

      expect(fromBalancePre.toString()).to.equal(fromBalancePost.toString());
    });

    it("should should credit properly with rounding error after debit", async () => {
      const debitAmount = new BN("1234560000000000000000");
      const refund = new BN("1000009999999999999999"); // Trailing 9s will be dropped.
      const tipTxFee = new BN("234550000000000000001"); // Trailing 1 will be dropped.
      const baseTxFee = new BN("1"); // This will be downscaled to 0.

      const fromBalancePre = await feeAdapter.balanceOf(from);
      await feeAdapter.debitGasFees(from, debitAmount, { from: vm });
      // Send all back to the from address for testing.
      await feeAdapter.creditGasFees(
        from,
        from,
        from,
        from,
        refund,
        tipTxFee,
        0,
        baseTxFee,
        { from: vm }
      );
      const fromBalancePost = await feeAdapter.balanceOf(from);

      // There should be no change in amounts even after all the scaling operations.
      expect(fromBalancePre.toString()).to.equal(fromBalancePost.toString());
    });

    it("should do nothing if debited is exactly 0", async () => {
      const balanceInitialFrom = await fiatToken.balanceOf(from);

      await feeAdapter.creditGasFees(from, from, from, from, 1, 1, 1, 1, {
        from: vm,
      });
      expect((await fiatToken.balanceOf(from)).toString()).to.equal(
        balanceInitialFrom.toString()
      );
    });

    it("should fail to credit more than debited", async () => {
      await feeAdapter.debitGasFees(from, debitAmount, {
        from: vm,
      });
      await expectRevert(
        feeAdapter.creditGasFees(
          from,
          from,
          from,
          from,
          debitAmount,
          debitAmount,
          debitAmount,
          debitAmount
        ),
        "FiatTokenFeeAdapterV1: Cannot credit more than debited"
      );
    });
  });
});
