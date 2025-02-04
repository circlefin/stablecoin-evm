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
const wrapTests = require("./helpers/wrapTests");
const {
  bigZero,
  expectRevert,
  checkVariables,
  name,
  symbol,
  currency,
  decimals,
  nullAccount,
  arbitraryAccount,
  tokenOwnerAccount,
  blacklisterAccount,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  proxyOwnerAccount,
  initializeTokenWithProxy,
  encodeCall,
  FiatTokenV1,
  deployUpgradedFiatTokenNewFields,
} = require("./helpers/tokenTest");

const amount = 100;

function runTests(newToken, version) {
  let rawToken, proxy, token;

  beforeEach(async () => {
    rawToken = await newToken();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  it("nut002 should fail to switch adminAccount with non-adminAccount as caller", async () => {
    await expectRevert(
      proxy.changeAdmin(masterMinterAccount, { from: masterMinterAccount })
    );
    assert.strictEqual(
      await proxy.admin({ from: proxyOwnerAccount }),
      proxyOwnerAccount
    );
    const customVars = [];
    await checkVariables([token], [customVars]);
  });

  it("nut003 should fail to upgradeTo to null contract address", async () => {
    await expectRevert(
      proxy.upgradeTo(nullAccount, { from: proxyOwnerAccount })
    );

    const customVars = [];
    await checkVariables([token], [customVars]);
  });

  it("nut004 should fail to upgradeToAndCall to null contract address", async () => {
    const initializeData = encodeCall("pauser", [], []);
    await expectRevert(
      proxy.upgradeToAndCall(nullAccount, initializeData, {
        from: proxyOwnerAccount,
      })
    );

    const customVars = [];
    await checkVariables([token], [customVars]);
  });

  it("nut005 should fail to initialize contract twice", async () => {
    await expectRevert(
      token.initialize(
        name,
        symbol,
        currency,
        decimals,
        masterMinterAccount,
        pauserAccount,
        blacklisterAccount,
        tokenOwnerAccount
      )
    );

    const customVars = [];
    await checkVariables([token], [customVars]);
  });

  it("nut006 should fail to call contract function with adminAccount", async () => {
    await expectRevert(
      token.allowance(minterAccount, arbitraryAccount, {
        from: proxyOwnerAccount,
      })
    );

    const customVars = [];
    await checkVariables([token], [customVars]);
  });

  it("nut008 shoud fail to update proxy storage if state-changing function called directly in FiatToken", async () => {
    await rawToken.initialize(
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      tokenOwnerAccount
    );
    assert.strictEqual(await rawToken.pauser(), pauserAccount);
    await rawToken.updatePauser(masterMinterAccount, {
      from: tokenOwnerAccount,
    });
    assert.strictEqual(await rawToken.pauser(), masterMinterAccount);

    const customVars = [];
    await checkVariables([token], [customVars]);
  });

  it("nut009 should fail to call upgradeTo with non-adminAccount", async () => {
    const upgradedToken = await newToken();
    await expectRevert(
      proxy.upgradeTo(upgradedToken.address, { from: masterMinterAccount })
    );
    const finalToken = await FiatTokenV1.at(proxy.address);
    const implementation = await proxy.implementation({
      from: proxyOwnerAccount,
    });
    finalToken.proxiedTokenAddress = implementation;

    const customVars = [];
    await checkVariables([finalToken], [customVars]);
  });

  it("nut010 should fail to call updateToAndCall with non-adminAccount", async () => {
    const upgradedToken = await deployUpgradedFiatTokenNewFields(version);
    const initializeData = encodeCall(
      "initialize",
      ["bool", "address", "uint256"],
      [true, pauserAccount, 12]
    );
    await expectRevert(
      proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
        from: masterMinterAccount,
      })
    );
    const finalToken = await FiatTokenV1.at(proxy.address);
    const implementation = await proxy.implementation({
      from: proxyOwnerAccount,
    });
    finalToken.proxiedTokenAddress = implementation;

    const customVars = [];
    await checkVariables([finalToken], [customVars]);
  });

  it("nut011 should fail to upgradeToAndCall with initialize (already set variables)", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    const upgradedToken = await deployUpgradedFiatTokenNewFields(version);
    const data = encodeCall(
      "initialize",
      [
        "string",
        "string",
        "string",
        "uint8",
        "address",
        "address",
        "address",
        "address",
        "bool",
        "address",
        "uint256",
      ],
      [
        name,
        symbol,
        currency,
        decimals,
        masterMinterAccount,
        pauserAccount,
        blacklisterAccount,
        tokenOwnerAccount,
        true,
        pauserAccount,
        12,
      ]
    );
    await expectRevert(
      proxy.upgradeToAndCall(upgradedToken.address, data, {
        from: proxyOwnerAccount,
      })
    );

    const customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: bigZero,
      },
      {
        variable: "balanceAndBlacklistStates.pauserAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });
}

wrapTests("FiatToken proxy negative", runTests);
