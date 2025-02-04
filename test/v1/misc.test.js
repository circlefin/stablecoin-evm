/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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

const BN = require("bn.js");
const {
  POW_2_255_HEX,
  POW_2_255_BN,
  POW_2_255_MINUS1_BN,
  POW_2_255_MINUS1_HEX,
  MAX_UINT256_HEX,
  MAX_UINT256_BN,
  ZERO_BYTES32,
} = require("../helpers/constants");
const wrapTests = require("./helpers/wrapTests");
const {
  checkVariables,
  expectRevert,
  arbitraryAccount,
  arbitraryAccount2,
  blacklisterAccount,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  initializeTokenWithProxy,
  getInitializedV1,
  FiatTokenV1,
  FiatTokenProxy,
} = require("./helpers/tokenTest");

const amount = 100;

function runTests(newToken, version) {
  let proxy, token;

  beforeEach(async () => {
    const rawToken = await newToken();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  // No Payable Function

  it("ms001 no payable function", async () => {
    let success = false;
    try {
      await web3.eth.sendTransaction({
        from: arbitraryAccount,
        to: token.address,
        value: 1,
      });
    } catch (e) {
      success = true;
    }
    assert.strictEqual(true, success);
  });

  // Same Address

  it("ms002 should transfer to self has correct final balance", async () => {
    const mintAmount = 50;
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(arbitraryAccount, mintAmount, {
      from: arbitraryAccount,
    });

    const customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms003 should transferFrom to self from approved account and have correct final balance", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });

    await token.approve(pauserAccount, mintAmount, { from: arbitraryAccount });
    await token.transferFrom(arbitraryAccount, arbitraryAccount, mintAmount, {
      from: pauserAccount,
    });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms004 should transferFrom to self from approved self and have correct final balance", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });

    await token.approve(arbitraryAccount, mintAmount, {
      from: arbitraryAccount,
    });
    await token.transferFrom(arbitraryAccount, arbitraryAccount, mintAmount, {
      from: arbitraryAccount,
    });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms005 should mint to self with correct final balance", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, mintAmount, { from: minterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.minterAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms006 should approve correct allowance for self", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.approve(arbitraryAccount, amount, { from: arbitraryAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
      {
        variable: "allowance.arbitraryAccount.arbitraryAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms007 should configureMinter for masterMinter", async () => {
    await token.configureMinter(masterMinterAccount, amount, {
      from: masterMinterAccount,
    });
    const customVars = [
      { variable: "isAccountMinter.masterMinterAccount", expectedValue: true },
      {
        variable: "minterAllowance.masterMinterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  // Multiple Minters

  it("ms009 should configure two minters", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount, {
      from: masterMinterAccount,
    });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms010 should configure two minters and each mint distinct amounts", async () => {
    const mintAmount1 = 10;
    const mintAmount2 = 20;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(pauserAccount, mintAmount1, { from: minterAccount });
    await token.mint(pauserAccount, mintAmount2, { from: arbitraryAccount });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount1),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount - mintAmount2),
      },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(mintAmount1 + mintAmount2),
      },
      {
        variable: "totalSupply",
        expectedValue: new BN(mintAmount1 + mintAmount2),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms011 should configure two minters, each minting distinct amounts and then remove one minter", async () => {
    const mintAmount1 = 10;
    const mintAmount2 = 20;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(pauserAccount, mintAmount1, { from: minterAccount });
    await token.mint(pauserAccount, mintAmount2, { from: arbitraryAccount });
    await token.removeMinter(arbitraryAccount, { from: masterMinterAccount });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount1),
      },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(mintAmount1 + mintAmount2),
      },
      {
        variable: "totalSupply",
        expectedValue: new BN(mintAmount1 + mintAmount2),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms012 should configure two minters and adjust both allowances", async () => {
    const adjustment = 10;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.configureMinter(minterAccount, amount - adjustment, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount + adjustment, {
      from: masterMinterAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - adjustment),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount + adjustment),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms013 should configure two minters, one with zero allowance fails to mint", async () => {
    const mintAmount = 10;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, 0, {
      from: masterMinterAccount,
    });
    await token.mint(pauserAccount, mintAmount, { from: minterAccount });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await expectRevert(
      token.mint(pauserAccount, mintAmount, { from: arbitraryAccount })
    );
    // await expectRevert(token.mint(pauserAccount, 0, { from: arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it("ms014 should configure two minters and fail to mint when paused", async () => {
    const mintAmount = 10;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount, {
      from: masterMinterAccount,
    });
    await token.pause({ from: pauserAccount });
    const customVars = [
      { variable: "paused", expectedValue: true },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount),
      },
    ];
    await expectRevert(
      token.mint(pauserAccount, mintAmount, { from: minterAccount })
    );
    await expectRevert(
      token.mint(pauserAccount, mintAmount, { from: arbitraryAccount })
    );
    await checkVariables([token], [customVars]);
  });

  it("ms015 should configure two minters, blacklist one and ensure it cannot mint, then unblacklist and ensure it can mint", async () => {
    const mintAmount = 10;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount, {
      from: masterMinterAccount,
    });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.mint(pauserAccount, mintAmount, { from: arbitraryAccount });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      { variable: "isAccountBlacklisted.minterAccount", expectedValue: true },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(mintAmount),
      },
    ];
    await expectRevert(
      token.mint(pauserAccount, mintAmount, { from: minterAccount })
    );
    await checkVariables([token], [customVars]);

    await token.unBlacklist(minterAccount, { from: blacklisterAccount });
    await token.mint(pauserAccount, mintAmount, { from: minterAccount });

    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "totalSupply",
        expectedValue: new BN(mintAmount + mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(mintAmount + mintAmount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms016 should configure two minters, each mints to themselves and then burns certain amount", async () => {
    const mintAmount1 = 10;
    const mintAmount2 = 20;
    const burnAmount = 10;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.configureMinter(arbitraryAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(minterAccount, mintAmount1, { from: minterAccount });
    await token.mint(arbitraryAccount, mintAmount2, { from: arbitraryAccount });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount1),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount - mintAmount2),
      },
      {
        variable: "balanceAndBlacklistStates.minterAccount",
        expectedValue: new BN(mintAmount1),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount2),
      },
      {
        variable: "totalSupply",
        expectedValue: new BN(mintAmount1 + mintAmount2),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.burn(burnAmount, { from: minterAccount });
    await token.burn(burnAmount, { from: arbitraryAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "isAccountMinter.arbitraryAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount1),
      },
      {
        variable: "minterAllowance.arbitraryAccount",
        expectedValue: new BN(amount - mintAmount2),
      },
      {
        variable: "balanceAndBlacklistStates.minterAccount",
        expectedValue: new BN(mintAmount1 - burnAmount),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount2 - burnAmount),
      },
      {
        variable: "totalSupply",
        expectedValue: new BN(
          mintAmount1 + mintAmount2 - burnAmount - burnAmount
        ),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  // 0 Input

  it("ms018 should approve 0 token allowance with unchanged state", async () => {
    await token.approve(minterAccount, 0, { from: arbitraryAccount });
    await checkVariables([token], [[]]);
  });

  it("ms019 should transferFrom 0 tokens with unchanged state", async () => {
    await token.transferFrom(arbitraryAccount, pauserAccount, 0, {
      from: arbitraryAccount2,
    });
    await checkVariables([token], [[]]);
  });

  it("ms020 should transfer 0 tokens with unchanged state", async () => {
    await token.transfer(arbitraryAccount, 0, { from: arbitraryAccount2 });
    await checkVariables([token], [[]]);
  });

  it("ms036 should get allowance for same address", async () => {
    await token.approve(arbitraryAccount, amount, { from: arbitraryAccount });
    const allowance = new BN(
      await token.allowance(arbitraryAccount, arbitraryAccount)
    );
    assert.isTrue(allowance.eq(new BN(amount)));
  });

  // Return value

  /*
   * Calls (i.e token.mint.call(...) , token.approve.call(...) etc.) expose the
   * return value of functions while transactions (token.mint(...) ,
   * token.approve(...) etc.) return transaction receipts and do not read
   * function return values. Calls, unlike transactions, do not permanently
   * modify data. However, both calls and transactions execute code on the
   * network. That is, token.mint.call(...) will revert if and only if
   * token.mint(...) reverts.
   *
   * "Choosing between a transaction and a call is as simple as deciding
   *  whether you want to read data, or write it."
   *  - truffle docs
   *    (https://truffleframework.com/docs/getting_started/contracts)
   */

  it("ms039 should return true on mint", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    assert(
      await token.mint.call(arbitraryAccount, mintAmount, {
        from: minterAccount,
      })
    );
    await checkVariables([token], [customVars]);
  });

  it("ms040 should return true on approve", async () => {
    assert.isTrue(
      await token.approve.call(minterAccount, amount, {
        from: arbitraryAccount,
      })
    );
  });

  it("ms041 should return true on transferFrom", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.approve(masterMinterAccount, mintAmount, {
      from: arbitraryAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
      {
        variable: "allowance.arbitraryAccount.masterMinterAccount",
        expectedValue: new BN(mintAmount),
      },
    ];
    assert.isTrue(
      await token.transferFrom.call(
        arbitraryAccount,
        pauserAccount,
        mintAmount,
        { from: masterMinterAccount }
      )
    );
    await checkVariables([token], [customVars]);
  });

  it("ms042 should return true on transfer", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    assert.isTrue(
      await token.transfer.call(pauserAccount, mintAmount, {
        from: arbitraryAccount,
      })
    );
    await checkVariables([token], [customVars]);
  });

  it("ms043 should return true on configureMinter", async () => {
    assert.isTrue(
      await token.configureMinter.call(minterAccount, amount, {
        from: masterMinterAccount,
      })
    );
  });

  it("ms044 should return true on removeMinter", async () => {
    assert.isTrue(
      await token.removeMinter.call(minterAccount, {
        from: masterMinterAccount,
      })
    );
  });

  it("ms045 initialized should be in slot 8, byte 21", async () => {
    const initialized = await getInitializedV1(token);
    assert.strictEqual("0x01", initialized);
  });

  it("ms046 initialized should be 0 before initialization", async () => {
    const rawToken = await newToken();
    const newProxy = await FiatTokenProxy.new(rawToken.address, {
      from: arbitraryAccount,
    });
    const token = await FiatTokenV1.at(newProxy.address);
    const initialized = await getInitializedV1(token);
    assert.strictEqual(ZERO_BYTES32, initialized);
  });

  it("ms047 configureMinter works on amount=2^256-1", async () => {
    await token.configureMinter(minterAccount, MAX_UINT256_HEX, {
      from: masterMinterAccount,
    });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: MAX_UINT256_BN,
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it(`ms048 mint works on amount=${
    version < 2.2 ? "2^256-1" : "2^255-1"
  }`, async () => {
    const [amount, amountBN] =
      version < 2.2
        ? [MAX_UINT256_HEX, MAX_UINT256_BN]
        : [POW_2_255_MINUS1_HEX, POW_2_255_MINUS1_BN];

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: amountBN,
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, amount, { from: minterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(0),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: amountBN,
      },
      { variable: "totalSupply", expectedValue: amountBN },
    ];
    await checkVariables([token], [customVars]);
  });

  if (version >= 2.2) {
    it("ms048(b) mint does not work on amount=2^255", async () => {
      await token.configureMinter(minterAccount, POW_2_255_HEX, {
        from: masterMinterAccount,
      });
      let customVars = [
        { variable: "isAccountMinter.minterAccount", expectedValue: true },
        {
          variable: "minterAllowance.minterAccount",
          expectedValue: POW_2_255_BN,
        },
      ];
      await checkVariables([token], [customVars]);

      await expectRevert(
        token.mint(arbitraryAccount, POW_2_255_HEX, { from: minterAccount })
      );
      customVars = [
        { variable: "isAccountMinter.minterAccount", expectedValue: true },
        {
          variable: "minterAllowance.minterAccount",
          expectedValue: POW_2_255_BN,
        },
        {
          variable: "balanceAndBlacklistStates.arbitraryAccount",
          expectedValue: new BN(0),
        },
        { variable: "totalSupply", expectedValue: new BN(0) },
      ];
      await checkVariables([token], [customVars]);
    });
  }

  it(`ms049 burn on works on amount=${
    version < 2.2 ? "2^256-1" : "2^255-1"
  }`, async () => {
    const [amount, amountBN] =
      version < 2.2
        ? [MAX_UINT256_HEX, MAX_UINT256_BN]
        : [POW_2_255_MINUS1_HEX, POW_2_255_MINUS1_BN];

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(minterAccount, amount, { from: minterAccount });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.minterAccount",
        expectedValue: amountBN,
      },
      { variable: "totalSupply", expectedValue: amountBN },
    ];
    await checkVariables([token], [customVars]);

    await token.burn(amount, { from: minterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ms050 approve works on amount=2^256-1", async () => {
    const [mintAmount, mintAmountBN] =
      version < 2.2
        ? [MAX_UINT256_HEX, MAX_UINT256_BN]
        : [POW_2_255_MINUS1_HEX, POW_2_255_MINUS1_BN];

    await token.configureMinter(minterAccount, mintAmount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, {
      from: minterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: mintAmountBN,
      },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(0),
      },
      { variable: "totalSupply", expectedValue: mintAmountBN },
    ];
    await checkVariables([token], [customVars]);

    await token.approve(pauserAccount, MAX_UINT256_HEX, {
      from: arbitraryAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: mintAmountBN,
      },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(0),
      },
      { variable: "totalSupply", expectedValue: mintAmountBN },
      {
        variable: "allowance.arbitraryAccount.pauserAccount",
        expectedValue: MAX_UINT256_BN,
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it(`ms051 transfer works on amount=${
    version < 2.2 ? "2^256-1" : "2^255-1"
  }`, async () => {
    const [amount, amountBN] =
      version < 2.2
        ? [MAX_UINT256_HEX, MAX_UINT256_BN]
        : [POW_2_255_MINUS1_HEX, POW_2_255_MINUS1_BN];

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, amount, { from: minterAccount });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: amountBN,
      },
      { variable: "totalSupply", expectedValue: amountBN },
    ];
    await checkVariables([token], [customVars]);

    await token.transfer(pauserAccount, amount, {
      from: arbitraryAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: amountBN,
      },
      { variable: "totalSupply", expectedValue: amountBN },
    ];
    await checkVariables([token], [customVars]);
  });

  it(`ms052 transferFrom works on amount=${
    version < 2.2 ? "2^256-1" : "2^255-1"
  }`, async () => {
    const [amount, amountBN] =
      version < 2.2
        ? [MAX_UINT256_HEX, MAX_UINT256_BN]
        : [POW_2_255_MINUS1_HEX, POW_2_255_MINUS1_BN];

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, amount, {
      from: minterAccount,
    });
    await token.approve(pauserAccount, amount, {
      from: arbitraryAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: amountBN,
      },
      { variable: "totalSupply", expectedValue: amountBN },
      {
        variable: "allowance.arbitraryAccount.pauserAccount",
        expectedValue: amountBN,
      },
    ];
    await checkVariables([token], [customVars]);

    await token.transferFrom(arbitraryAccount, pauserAccount, amount, {
      from: pauserAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: amountBN,
      },
      { variable: "totalSupply", expectedValue: amountBN },
    ];
    await checkVariables([token], [customVars]);
  });
}

wrapTests("FiatToken misc", runTests);
