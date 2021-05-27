const MintController = artifacts.require("minting/MintController");
const MasterMinter = artifacts.require("minting/MasterMinter");
const FiatToken = artifacts.require("FiatTokenV1");

const tokenUtils = require("../v1/TokenTestUtils");
const newBigNumber = tokenUtils.newBigNumber;
const checkMINTp0 = tokenUtils.checkMINTp0;
const expectRevert = tokenUtils.expectRevert;
const expectError = tokenUtils.expectError;
const bigZero = tokenUtils.bigZero;

const clone = require("clone");

const mintUtils = require("./MintControllerUtils.js");
const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const addressEquals = AccountUtils.addressEquals;
const initializeTokenWithProxyAndMintController =
  mintUtils.initializeTokenWithProxyAndMintController;

const zeroAddress = "0x0000000000000000000000000000000000000000";
const maxAmount =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

async function run_tests_MintController(newToken, accounts) {
  run_MINT_tests(newToken, MintController, accounts);
}

async function run_tests_MasterMinter(newToken, accounts) {
  run_MINT_tests(newToken, MasterMinter, accounts);
}

let rawToken;
let tokenConfig;
let token;
let mintController;
let expectedMintControllerState;
let expectedTokenState;

async function run_MINT_tests(newToken, MintControllerArtifact) {
  beforeEach("Make fresh token contract", async function () {
    rawToken = await newToken();
    tokenConfig = await initializeTokenWithProxyAndMintController(
      rawToken,
      MintControllerArtifact
    );
    token = tokenConfig.token;
    mintController = tokenConfig.mintController;
    expectedMintControllerState = clone(tokenConfig.customState);
    expectedTokenState = [
      { variable: "masterMinter", expectedValue: mintController.address },
    ];
  });

  it("arg000 transferOwnership(msg.sender) works", async function () {
    await mintController.transferOwnership(Accounts.mintOwnerAccount, {
      from: Accounts.mintOwnerAccount,
    });
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg001 transferOwnership(0) reverts", async function () {
    await expectRevert(
      mintController.transferOwnership(zeroAddress, {
        from: Accounts.mintOwnerAccount,
      })
    );
  });

  it("arg002 transferOwnership(owner) works", async function () {
    await mintController.transferOwnership(Accounts.mintOwnerAccount, {
      from: Accounts.mintOwnerAccount,
    });
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg003 configureController(0, M) throws", async function () {
    await expectError(
      mintController.configureController(zeroAddress, Accounts.minterAccount, {
        from: Accounts.mintOwnerAccount,
      }),
      "Controller must be a non-zero address"
    );
  });

  it("arg004 configureController(msg.sender, M) works", async function () {
    await mintController.configureController(
      Accounts.mintOwnerAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.mintOwnerAccount =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg005 configureController(M, M) works", async function () {
    await mintController.configureController(
      Accounts.minterAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.minterAccount =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg006 configureController(C, 0) throws", async function () {
    await expectError(
      mintController.configureController(
        Accounts.controller1Account,
        zeroAddress,
        { from: Accounts.mintOwnerAccount }
      ),
      "Worker must be a non-zero address"
    );
  });

  it("arg007 removeController(0) throws", async function () {
    // expect no changes
    await expectError(
      mintController.removeController(zeroAddress, {
        from: Accounts.mintOwnerAccount,
      }),
      "Controller must be a non-zero address"
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg008 setMinterManager(0) works", async function () {
    await mintController.setMinterManager(zeroAddress, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = zeroAddress;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg009 setMinterManager(oldMinterManager) works", async function () {
    await mintController.setMinterManager(token.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = token.address;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg010 setMinterManager(user_account) works", async function () {
    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg011 setMinterManager(newToken) works", async function () {
    const newToken = await FiatToken.new();
    await mintController.setMinterManager(newToken.address, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = newToken.address;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg012 configureMinter(0) sets allowance to 0", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
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

  it("arg013 configureMinter(oldAllowance) makes no changes", async function () {
    const oldAllowance = 64738;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(oldAllowance, {
      from: Accounts.controller1Account,
    });
    await mintController.configureMinter(oldAllowance, {
      from: Accounts.controller1Account,
    });

    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(oldAllowance),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg014 configureMinter(MAX) works", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(maxAmount, {
      from: Accounts.controller1Account,
    });

    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(maxAmount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg015 incrementMinterAllowance(0) throws", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await expectError(
      mintController.incrementMinterAllowance(0, {
        from: Accounts.controller1Account,
      }),
      "Allowance increment must be greater than 0"
    );
  });

  it("arg016 incrementMinterAllowance(oldAllowance) doubles the allowance", async function () {
    const amount = 897;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    await mintController.incrementMinterAllowance(amount, {
      from: Accounts.controller1Account,
    });

    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(2 * amount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg017 incrementMinterAllowance(MAX) throws", async function () {
    const amount = 1;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    await expectRevert(
      mintController.incrementMinterAllowance(maxAmount, {
        from: Accounts.controller1Account,
      })
    );
  });

  it("arg018 incrementMinterAllowance(BIG) throws", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(maxAmount, {
      from: Accounts.controller1Account,
    });
    await expectRevert(
      mintController.incrementMinterAllowance(1, {
        from: Accounts.controller1Account,
      })
    );
  });

  it("arg019 configureController(0, 0) throws", async function () {
    await expectError(
      mintController.configureController(zeroAddress, zeroAddress, {
        from: Accounts.mintOwnerAccount,
      }),
      "Controller must be a non-zero address"
    );
  });

  it("arg020 removeController(C) works", async function () {
    // make controller1Account a controller
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    let actualMinter = await mintController.getWorker(
      Accounts.controller1Account
    );
    addressEquals(Accounts.minterAccount, actualMinter);

    // remove controller1Account
    await mintController.removeController(Accounts.controller1Account, {
      from: Accounts.mintOwnerAccount,
    });
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
    actualMinter = await mintController.getWorker(Accounts.controller1Account);
    addressEquals(actualMinter, zeroAddress);
  });

  it("arg021 removeController throws if worker is already address(0)", async function () {
    // make controller1Account a controller
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    let actualMinter = await mintController.getWorker(
      Accounts.controller1Account
    );
    addressEquals(Accounts.minterAccount, actualMinter);

    // remove controller1Account
    await mintController.removeController(Accounts.controller1Account, {
      from: Accounts.mintOwnerAccount,
    });
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
    actualMinter = await mintController.getWorker(Accounts.controller1Account);
    addressEquals(actualMinter, zeroAddress);

    // attempting to remove the controller1Account again should throw because the worker is already set to address(0).
    await expectError(
      mintController.removeController(Accounts.controller1Account, {
        from: Accounts.mintOwnerAccount,
      }),
      "Worker must be a non-zero address"
    );
  });

  it("arg022 decrementMinterAllowance(oldAllowance) sets the allowance to 0", async function () {
    const amount = 897;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    await mintController.decrementMinterAllowance(amount, {
      from: Accounts.controller1Account,
    });

    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "minterAllowance.minterAccount", expectedValue: bigZero }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg023 decrementMinterAllowance(MIN) sets the allowance to 0", async function () {
    const amount = 0;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });
    await mintController.decrementMinterAllowance(1, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "minterAllowance.minterAccount", expectedValue: bigZero }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("arg024 decrementMinterAllowance(0) throws", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await expectError(
      mintController.decrementMinterAllowance(0, {
        from: Accounts.controller1Account,
      }),
      "Allowance decrement must be greater than 0"
    );
  });
}

const wrapTests = require("../v1/helpers/wrapTests");
wrapTests("MINTp0_ArgumentTests MintController", run_tests_MintController);
wrapTests("MINTp0_ArgumentTests MasterMinter", run_tests_MasterMinter);
