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

import {
  expectRevert,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../../helpers";

const MockFiatTokenCeloWithExposedFunctions = artifacts.require(
  "MockFiatTokenCeloWithExposedFunctions"
);

import { MockFiatTokenCeloWithExposedFunctionsInstance } from "../../../@types/generated";
import {
  HARDHAT_ACCOUNTS,
  MAX_UINT256_BN,
  POW_2_255_MINUS1_HEX,
  ZERO_ADDRESS,
} from "../../helpers/constants";

describe("MockFiatTokenCeloWithExposedFunctions", () => {
  // See FiatTokenCeloV2_2#DEBITED_VALUE_SLOT.
  const debitedValueSlot =
    "0xd90dccaa76fe7208f2f477143b6adabfeb5d4a5136982894dfc51177fa8eda28";

  const fiatTokenOwner = HARDHAT_ACCOUNTS[0];
  const lostAndFound = HARDHAT_ACCOUNTS[1];
  const from = HARDHAT_ACCOUNTS[2];
  const feeRecipient = HARDHAT_ACCOUNTS[3];
  const gatewayFeeRecipient = HARDHAT_ACCOUNTS[4];
  const communityFund = HARDHAT_ACCOUNTS[5];
  // For these tests, explicitly declare blacklister, master minter, and pauser
  // variables, even though they'll be initialized to the same address as the owner.
  const blacklister = fiatTokenOwner;
  const masterMinter = fiatTokenOwner;
  const pauser = fiatTokenOwner;
  const feeCaller = fiatTokenOwner;

  const debitAmount = 1e6;

  const pausedError = "Pausable: paused";
  const blacklistedError = "Blacklistable: account is blacklisted";
  const debitInvariantError =
    "FiatTokenCeloV2_2: Must fully credit before debit";
  const creditInvariantError =
    "FiatTokenCeloV2_2: Either no debit or mismatched debit";
  const additionOverflowError = "SafeMath: addition overflow";
  const transferFromZeroError = "ERC20: transfer from the zero address";

  let fiatToken: MockFiatTokenCeloWithExposedFunctionsInstance;

  before(async () => {
    await linkLibraryToTokenContract(MockFiatTokenCeloWithExposedFunctions);
  });

  beforeEach(async () => {
    fiatToken = await MockFiatTokenCeloWithExposedFunctions.new();
    await initializeToVersion(fiatToken, "2.2", fiatTokenOwner, lostAndFound);

    // Configure some minter allowance (1M) ahead of time.
    const mintAllowance = 1000000e6;
    await fiatToken.configureMinter(feeCaller, mintAllowance, {
      from: masterMinter,
    });
    // Set the from address up with some funding.
    await fiatToken.mint(from, 1000e6, { from: feeCaller });

    await fiatToken.updateFeeCaller(feeCaller);
  });

  describe("debitGasFees", () => {
    it("should debit with correct fee caller address", async () => {
      const balanceFrom = await fiatToken.balanceOf(from);

      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(
        balanceFrom.toNumber() - debitAmount
      );
      expect((await fiatToken.balanceOf(ZERO_ADDRESS)).toNumber()).to.equal(
        debitAmount
      );
      expect(
        web3.utils.hexToNumber(
          await web3.eth.getStorageAt(fiatToken.address, debitedValueSlot)
        )
      )
        .to.equal(debitAmount)
        .to.equal((await fiatToken.internal_debitedValue()).toNumber());
    });

    it("should fail to debit again with ongoing debit", async () => {
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      await expectRevert(
        fiatToken.debitGasFees(from, debitAmount, { from: feeCaller }),
        debitInvariantError
      );
    });

    it("should fail to debit from the zero address", async () => {
      await expectRevert(
        fiatToken.debitGasFees(ZERO_ADDRESS, debitAmount, { from: feeCaller }),
        transferFromZeroError
      );
    });

    it("should fail when contract is paused", async () => {
      await fiatToken.pause({ from: pauser });
      await expectRevert(
        fiatToken.debitGasFees(from, debitAmount, { from: feeCaller }),
        pausedError
      );
    });

    it("should fail when `from` is blacklisted", async () => {
      await fiatToken.blacklist(from, { from: blacklister });
      await expectRevert(
        fiatToken.debitGasFees(from, debitAmount, { from: feeCaller }),
        blacklistedError
      );
    });
  });

  describe("creditGasFees", () => {
    const tipTxFee = 1e5;
    // Invariant: the network does not actually make use of the gateway fee.
    const gatewayFee = 0;
    const baseTxFee = 3e5;

    // The original debit always equals refund + tipTxFee + gatewayFee + baseTxFee.
    const refund: number = debitAmount - tipTxFee - gatewayFee - baseTxFee;

    it("should credit after debit with correct fee caller address", async () => {
      const fromBalancePre = (await fiatToken.balanceOf(from)).toNumber();
      const feeRecipientBalancePre = (
        await fiatToken.balanceOf(feeRecipient)
      ).toNumber();
      const gatewayFeeRecipientBalancePre = (
        await fiatToken.balanceOf(gatewayFeeRecipient)
      ).toNumber();
      const communityFundBalancePre = (
        await fiatToken.balanceOf(communityFund)
      ).toNumber();

      // In practice, this debiting and crediting sequence should always be atomic
      // within the Celo VM core state transition code itself. See L481 and L517 at
      // https://github.com/celo-org/celo-blockchain/blob/3808c45addf56cf547581599a1cb059bc4ae5089/core/state_transition.go#L426-L526.
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      expect(
        web3.utils.hexToNumber(
          await web3.eth.getStorageAt(fiatToken.address, debitedValueSlot)
        )
      )
        .to.equal(debitAmount)
        .to.equal((await fiatToken.internal_debitedValue()).toNumber());

      await fiatToken.creditGasFees(
        from,
        feeRecipient,
        gatewayFeeRecipient,
        communityFund,
        refund,
        tipTxFee,
        gatewayFee,
        baseTxFee,
        { from: feeCaller }
      );
      expect(
        web3.utils.hexToNumber(
          await web3.eth.getStorageAt(fiatToken.address, debitedValueSlot)
        )
      )
        .to.equal(0)
        .to.equal((await fiatToken.internal_debitedValue()).toNumber());
      const fromBalancePost = (await fiatToken.balanceOf(from)).toNumber();
      const feeRecipientBalancePost = (
        await fiatToken.balanceOf(feeRecipient)
      ).toNumber();
      const gatewayFeeRecipientBalancePost = (
        await fiatToken.balanceOf(gatewayFeeRecipient)
      ).toNumber();
      const communityFundBalancePost = (
        await fiatToken.balanceOf(communityFund)
      ).toNumber();

      expect(fromBalancePost).to.equal(fromBalancePre - debitAmount + refund);
      expect(feeRecipientBalancePost).to.equal(
        feeRecipientBalancePre + tipTxFee
      );
      expect(gatewayFeeRecipientBalancePost).to.equal(
        gatewayFeeRecipientBalancePre + gatewayFee
      );
      expect(communityFundBalancePost).to.equal(
        communityFundBalancePre + baseTxFee
      );
    });

    it("should fail to credit with mismatched debit amount", async () => {
      // (_debitedValue != refund + tipTxFee + gatewayFee + baseTxFee)
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      await expectRevert(
        fiatToken.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          // Mess with the refund here to break the invariant.
          refund - 1,
          tipTxFee,
          gatewayFee,
          baseTxFee,
          { from: feeCaller }
        ),
        creditInvariantError
      );
    });

    it("should fail to credit with no ongoing debit", async () => {
      // (_debitedValue = 0)
      await expectRevert(
        fiatToken.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          refund,
          tipTxFee,
          gatewayFee,
          baseTxFee,
          { from: feeCaller }
        ),
        creditInvariantError
      );
    });

    it("should fail to credit when total amount can overflow (SafeMath)", async () => {
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      await expectRevert(
        fiatToken.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          MAX_UINT256_BN,
          MAX_UINT256_BN,
          MAX_UINT256_BN,
          MAX_UINT256_BN,
          { from: feeCaller }
        ),
        additionOverflowError
      );
    });

    it("should fail when contract is paused", async () => {
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      await fiatToken.pause({ from: pauser });
      await expectRevert(
        fiatToken.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          refund,
          tipTxFee,
          gatewayFee,
          baseTxFee,
          { from: feeCaller }
        ),
        pausedError
      );
    });

    it("should fail when `from` is blacklisted", async () => {
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      await fiatToken.blacklist(from, { from: blacklister });
      await expectRevert(
        fiatToken.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          refund,
          tipTxFee,
          gatewayFee,
          baseTxFee,
          { from: feeCaller }
        ),
        blacklistedError
      );
    });

    it("should fail when `feeRecipient` is blacklisted", async () => {
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      await fiatToken.blacklist(feeRecipient, { from: blacklister });
      await expectRevert(
        fiatToken.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          refund,
          tipTxFee,
          gatewayFee,
          baseTxFee,
          { from: feeCaller }
        ),
        blacklistedError
      );
    });

    it("should fail when `communityFund` is blacklisted", async () => {
      await fiatToken.debitGasFees(from, debitAmount, { from: feeCaller });
      await fiatToken.blacklist(communityFund, { from: blacklister });
      await expectRevert(
        fiatToken.creditGasFees(
          from,
          feeRecipient,
          gatewayFeeRecipient,
          communityFund,
          refund,
          tipTxFee,
          gatewayFee,
          baseTxFee,
          { from: feeCaller }
        ),
        blacklistedError
      );
    });
  });

  describe("_transferReservedGas", () => {
    const zeroGasError = "FiatTokenCeloV2_2: Must reserve > 0 gas";
    const balanceExceededError = "FiatTokenV2_2: Balance exceeds (2^255 - 1)";
    const balanceInsufficientError = "ERC20: transfer amount exceeds balance";

    const validTransferAmt = 1e4;

    it("should fail when 0 reserved gas is requested", async () => {
      await expectRevert(
        fiatToken.internal_transferReservedGas(from, ZERO_ADDRESS, 0, {
          from: feeCaller,
        }),
        zeroGasError
      );
    });

    it("should fail when _to's balance will exceed 2^255 - 1", async () => {
      // Granting enough balance to feeCaller
      await fiatToken.internal_setBalance(feeCaller, POW_2_255_MINUS1_HEX);
      await fiatToken.internal_setBalance(from, validTransferAmt);

      await expectRevert(
        fiatToken.internal_transferReservedGas(
          feeCaller,
          from,
          POW_2_255_MINUS1_HEX,
          { from: feeCaller }
        ),
        balanceExceededError
      );
    });

    it("should fail when _from's balance < _value", async () => {
      await expectRevert(
        fiatToken.internal_transferReservedGas(
          feeCaller,
          from,
          (await fiatToken.balanceOf(feeCaller)).toNumber() + 100,
          {
            from: feeCaller,
          }
        ),
        balanceInsufficientError
      );
    });
  });
});
