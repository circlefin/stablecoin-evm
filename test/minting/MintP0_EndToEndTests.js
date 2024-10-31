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
const MasterMinter = artifacts.require("minting/MasterMinter");

const {
  newBigNumber,
  checkMINTp0,
  expectRevert,
  expectError,
  initializeTokenWithProxy,
} = require("../v1/helpers/tokenTest.js");

const { cloneDeep } = require("lodash");

const mintUtils = require("./MintControllerUtils.js");
const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const initializeTokenWithProxyAndMintController =
  mintUtils.initializeTokenWithProxyAndMintController;

let mintController;
let expectedMintControllerState;
let expectedTokenState;
let token;
let rawToken;
let tokenConfig;

async function run_tests_MintController(newToken, accounts) {
  run_MINT_tests(newToken, MintController, accounts);
}

async function run_tests_MasterMinter(newToken, accounts) {
  run_MINT_tests(newToken, MasterMinter, accounts);
}

async function run_MINT_tests(newToken, MintControllerArtifact) {
  beforeEach("Make fresh token contract", async function () {
    rawToken = await newToken();
    tokenConfig = await initializeTokenWithProxyAndMintController(
      rawToken,
      MintControllerArtifact
    );
    token = tokenConfig.token;
    mintController = tokenConfig.mintController;
    expectedMintControllerState = cloneDeep(tokenConfig.customState);
    expectedTokenState = [
      { variable: "masterMinter", expectedValue: mintController.address },
    ];
  });

  it("ete000 New owner can configure controllers", async function () {
    await mintController.transferOwnership(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    await mintController.configureController(
      Accounts.arbitraryAccount2,
      Accounts.minterAccount,
      { from: Accounts.arbitraryAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount2 =
      Accounts.minterAccount;
    expectedMintControllerState.owner = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete001 New owner can remove controllers", async function () {
    await mintController.transferOwnership(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    await mintController.configureController(
      Accounts.arbitraryAccount2,
      Accounts.minterAccount,
      { from: Accounts.arbitraryAccount }
    );
    await mintController.removeController(Accounts.arbitraryAccount2, {
      from: Accounts.arbitraryAccount,
    });
    expectedMintControllerState.owner = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete002 New controller can configure minter", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(10),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete003 Configure two controllers for the same minter and make sure they can both configureMinter", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureController(
      Accounts.arbitraryAccount2,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedMintControllerState.controllers.arbitraryAccount2 =
      Accounts.minterAccount;

    // first controller configures minter
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(10),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // second controller configures minter
    await mintController.configureMinter(30, {
      from: Accounts.arbitraryAccount2,
    });
    expectedTokenState.push({
      variable: "minterAllowance.minterAccount",
      expectedValue: newBigNumber(30),
    });
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete004 Configure two controllers for the same minter, one adds a minter and the other removes it", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureController(
      Accounts.arbitraryAccount2,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedMintControllerState.controllers.arbitraryAccount2 =
      Accounts.minterAccount;

    // first controller configures minter
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(10),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // second controller remove minter
    await mintController.removeMinter({ from: Accounts.arbitraryAccount2 });
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: false },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(0),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete005 Configure two controllers for different minters and make sure 2nd cant remove", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureController(
      Accounts.arbitraryAccount2,
      Accounts.pauserAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedMintControllerState.controllers.arbitraryAccount2 =
      Accounts.minterAccount;

    // first controller configures minter
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(10),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // second controller fails to remove minter (expectedTokenState unchanged)
    await mintController.removeMinter({ from: Accounts.arbitraryAccount2 });
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete006 Configure two controllers for different minters and make sure 2nd cant configure", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureController(
      Accounts.arbitraryAccount2,
      Accounts.pauserAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedMintControllerState.controllers.arbitraryAccount2 =
      Accounts.minterAccount;

    // second controller fails to configure minter (configures pauser instead)
    await mintController.configureMinter(20, {
      from: Accounts.arbitraryAccount2,
    });
    expectedTokenState.push(
      { variable: "isAccountMinter.pauserAccount", expectedValue: true },
      {
        variable: "minterAllowance.pauserAccount",
        expectedValue: newBigNumber(20),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete007 Remove a controller and make sure it can't modify minter", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.removeController(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    await expectError(
      mintController.configureMinter(10, { from: Accounts.arbitraryAccount }),
      "The value of controllers[msg.sender] must be non-zero"
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete008 Change minter manager and make sure existing controllers still can configure their minters", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;

    // change minterManager to a new token
    const newTokenConfig = await initializeTokenWithProxy(rawToken);
    const newToken = newTokenConfig.token;
    await newToken.updateMasterMinter(mintController.address, {
      from: Accounts.tokenOwnerAccount,
    });
    await mintController.setMinterManager(newToken.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = newToken.address;

    // now use controller to configure minter
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(10),
      }
    );
    await checkMINTp0(
      [newToken, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete009 Change minter manager and make sure existing controllers still can remove their minters", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;

    // change minterManager to a new token
    const newTokenConfig = await initializeTokenWithProxy(rawToken);
    const newToken = newTokenConfig.token;
    await newToken.updateMasterMinter(mintController.address, {
      from: Accounts.tokenOwnerAccount,
    });
    await mintController.setMinterManager(newToken.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = newToken.address;

    // now use controller to configure and remove minter
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    await mintController.removeMinter({ from: Accounts.arbitraryAccount });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    await checkMINTp0(
      [newToken, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete010 Change minter manager and make sure existing controllers can increment allowances", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;

    // change minterManager to a new token
    const newTokenConfig = await initializeTokenWithProxy(rawToken);
    const newToken = newTokenConfig.token;
    await newToken.updateMasterMinter(mintController.address, {
      from: Accounts.tokenOwnerAccount,
    });
    await mintController.setMinterManager(newToken.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = newToken.address;

    // now use controller to configure minter
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    await mintController.incrementMinterAllowance(20, {
      from: Accounts.arbitraryAccount,
    });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(30),
      }
    );
    await checkMINTp0(
      [newToken, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete011 New controller can increment minter allowance", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.arbitraryAccount,
    });
    await mintController.incrementMinterAllowance(10, {
      from: Accounts.arbitraryAccount,
    });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(10),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete012 New controller can remove minter", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    await mintController.removeMinter({ from: Accounts.arbitraryAccount });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete013 Change minter manager, configure a minter, then change back and make sure changes DID NOT propogate", async function () {
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;

    // change minterManager to a new token
    const newTokenConfig = await initializeTokenWithProxy(rawToken);
    const newToken = newTokenConfig.token;
    await newToken.updateMasterMinter(mintController.address, {
      from: Accounts.tokenOwnerAccount,
    });
    await mintController.setMinterManager(newToken.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = newToken.address;

    // now use controller to configure minter
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(10),
      }
    );
    await checkMINTp0(
      [newToken, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // change minterManager to original token and make sure changes did not propagate
    await mintController.setMinterManager(token.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = token.address;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: false },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(0),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete014 Remove a minter and then try to increment its allowance reverts", async function () {
    // add and remove minter
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    await mintController.removeMinter({ from: Accounts.arbitraryAccount });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;

    // now verify that incrementing its allowance reverts
    expectError(
      mintController.incrementMinterAllowance(20, {
        from: Accounts.arbitraryAccount,
      }),
      "Can only increment allowance for minters in minterManager"
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete015 Configure a minter and make sure it can mint", async function () {
    // configure a minter
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });

    // now verify it can mint
    await token.mint(Accounts.arbitraryAccount, 5, {
      from: Accounts.minterAccount,
    });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(5),
      },
      {
        variable: "balanceAndBlacklistStates.arbitraryAccount",
        expectedValue: newBigNumber(5),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(5) }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete016 Remove a minter and make sure it cannot mint", async function () {
    // add and remove minter
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    await mintController.removeMinter({ from: Accounts.arbitraryAccount });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;

    // now verify that minter cannot mint
    expectRevert(
      token.mint(Accounts.arbitraryAccount2, 5, {
        from: Accounts.minterAccount,
      })
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete017 Configure a minter and make sure it can burn", async function () {
    // configure a minter
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });

    // now verify it can burn
    await token.mint(Accounts.minterAccount, 5, {
      from: Accounts.minterAccount,
    });
    await token.burn(5, { from: Accounts.minterAccount });
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(5),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("ete018 Remove a minter and make sure it cannot burn", async function () {
    // add minter,  use it to mint to itself, and remove it again
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(10, {
      from: Accounts.arbitraryAccount,
    });
    await token.mint(Accounts.minterAccount, 5, {
      from: Accounts.minterAccount,
    });
    await mintController.removeMinter({ from: Accounts.arbitraryAccount });

    // now verify that minter cannot burn
    expectRevert(token.burn(5, { from: Accounts.minterAccount }));
    expectedMintControllerState.controllers.arbitraryAccount =
      Accounts.minterAccount;
    expectedTokenState.push(
      {
        variable: "balanceAndBlacklistStates.minterAccount",
        expectedValue: newBigNumber(5),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(5) }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });
}

const wrapTests = require("../v1/helpers/wrapTests");
wrapTests("MINTp0_EndToEndTests MintController", run_tests_MintController);
wrapTests("MINTp0_EndToEndTests MasterMinter", run_tests_MasterMinter);
