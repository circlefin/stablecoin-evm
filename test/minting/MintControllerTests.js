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

const MintController = artifacts.require("minting/MintController");

const {
  newBigNumber,
  checkMINTp0,
  expectRevert,
  expectError,
  bigZero,
} = require("../v1/helpers/tokenTest.js");

const { cloneDeep } = require("lodash");

const mintUtils = require("./MintControllerUtils.js");
const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const initializeTokenWithProxyAndMintController =
  mintUtils.initializeTokenWithProxyAndMintController;

let rawToken;
let tokenConfig;
let token;
let mintController;
let expectedMintControllerState;
let expectedTokenState;

async function run_tests(newToken) {
  beforeEach("Make fresh token contract", async function () {
    rawToken = await newToken();
    tokenConfig = await initializeTokenWithProxyAndMintController(
      rawToken,
      MintController
    );
    token = tokenConfig.token;
    mintController = tokenConfig.mintController;
    expectedMintControllerState = cloneDeep(tokenConfig.customState);
    expectedTokenState = [
      { variable: "masterMinter", expectedValue: mintController.address },
    ];
  });

  it("should mint through mint controller", async function () {
    const amount = 5000;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;

    await token.mint(Accounts.arbitraryAccount, amount, {
      from: Accounts.minterAccount,
    });
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: newBigNumber(amount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(amount) }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("initial state", async function () {
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("only owner configures controller", async function () {
    await expectRevert(
      mintController.configureController(
        Accounts.controller1Account,
        Accounts.minterAccount,
        { from: Accounts.minterAccount }
      )
    );
  });

  it("remove controller", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    await mintController.removeController(Accounts.controller1Account, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.controllers.controller1Account = bigZero;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("only owner can remove controller", async function () {
    await expectRevert(
      mintController.removeController(Accounts.controller1Account, {
        from: Accounts.minterAccount,
      })
    );
  });

  it("sets token", async function () {
    await mintController.setMinterManager(mintController.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = mintController.address;
    checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("only owner sets token", async function () {
    await expectRevert(
      mintController.setMinterManager(mintController.address, {
        from: Accounts.minterAccount,
      })
    );
  });

  it("remove minter", async function () {
    // create a minter
    const amount = 500;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // remove minter
    await mintController.removeMinter({ from: Accounts.controller1Account });
    expectedTokenState = [
      { variable: "masterMinter", expectedValue: mintController.address },
    ];
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("only controller removes a minter", async function () {
    await expectError(
      mintController.removeMinter({ from: Accounts.controller1Account }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("only controller configures a minter", async function () {
    await expectError(
      mintController.configureMinter(0, { from: Accounts.controller1Account }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("increment minter allowance", async function () {
    // configure controller & minter
    const amount = 500;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // increment minter allowance
    await mintController.incrementMinterAllowance(amount, {
      from: Accounts.controller1Account,
    });
    expectedTokenState = [
      { variable: "masterMinter", expectedValue: mintController.address },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount * 2),
      },
    ];
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("only controller increments allowance", async function () {
    await expectError(
      mintController.incrementMinterAllowance(0, {
        from: Accounts.controller1Account,
      }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("only active minters can have allowance incremented", async function () {
    // configure controller but not minter
    const amount = 500;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // increment minter allowance
    await expectError(
      mintController.incrementMinterAllowance(amount, {
        from: Accounts.controller1Account,
      }),
      "Can only increment allowance for minters in minterManager"
    );
  });

  it("decrement minter allowance", async function () {
    // configure controller & minter
    const amount = 500;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // decrement minter allowance
    await mintController.decrementMinterAllowance(amount, {
      from: Accounts.controller1Account,
    });
    expectedTokenState = [
      { variable: "masterMinter", expectedValue: mintController.address },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "minterAllowance.minterAccount", expectedValue: bigZero },
    ];
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("only controller decrements allowance", async function () {
    await expectError(
      mintController.decrementMinterAllowance(0, {
        from: Accounts.controller1Account,
      }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("only active minters can have allowance decremented", async function () {
    // configure controller but not minter
    const amount = 500;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // decrement minter allowance
    await expectError(
      mintController.decrementMinterAllowance(amount, {
        from: Accounts.controller1Account,
      }),
      "Can only decrement allowance for minters in minterManager"
    );
  });
}

const wrapTests = require("../v1/helpers/wrapTests");
wrapTests("MintController_Tests MintController", run_tests);

module.exports = {
  run_tests: run_tests,
};
