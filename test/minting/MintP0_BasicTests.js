const MintController = artifacts.require("minting/MintController");
const MasterMinter = artifacts.require("minting/MasterMinter");
const FiatToken = artifacts.require("FiatTokenV1");

const tokenUtils = require("../v1/TokenTestUtils.js");
const newBigNumber = tokenUtils.newBigNumber;
const checkMINTp0 = tokenUtils.checkMINTp0;
const expectRevert = tokenUtils.expectRevert;
const expectError = tokenUtils.expectError;
const bigZero = tokenUtils.bigZero;
const maxAmount = tokenUtils.maxAmount;

const clone = require("clone");

const mintUtils = require("./MintControllerUtils.js");
const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const getAccountState = AccountUtils.getAccountState;
const addressEquals = AccountUtils.addressEquals;
const initializeTokenWithProxyAndMintController =
  mintUtils.initializeTokenWithProxyAndMintController;

const zeroAddress = "0x0000000000000000000000000000000000000000";

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

  it("bt001 Constructor - owner is msg.sender", async function () {
    const newMintController = await MintController.new(token.address, {
      from: Accounts.arbitraryAccount,
    });
    const owner = await newMintController.owner();
    assert.isTrue(addressEquals(owner, Accounts.arbitraryAccount));
  });

  it("bt002 transferOwnership works when owner is msg.sender", async function () {
    await mintController.transferOwnership(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.owner = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt003 transferOwnership reverts when owner is not msg.sender", async function () {
    await expectRevert(
      mintController.transferOwnership(Accounts.arbitraryAccount, {
        from: Accounts.arbitraryAccount,
      })
    );
  });

  it("bt004 configureController works when owner is msg.sender", async function () {
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
  });

  it("bt005 configureController reverts when owner is not msg.sender", async function () {
    await expectRevert(
      mintController.configureController(
        Accounts.controller1Account,
        Accounts.minterAccount,
        { from: Accounts.arbitraryAccount }
      )
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt006 setMinterManager works when owner is msg.sender", async function () {
    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt007 setMinterManager reverts when owner is not msg.sender", async function () {
    await expectRevert(
      mintController.setMinterManager(Accounts.arbitraryAccount, {
        from: Accounts.arbitraryAccount,
      })
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt008 removeController works when owner is msg.sender", async function () {
    // add a controller
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

    // now remove it
    await mintController.removeController(Accounts.controller1Account, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.controllers.controller1Account = zeroAddress;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt009 removeController reverts when owner is not msg.sender", async function () {
    // add a controller
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

    // fail to remove it
    await expectRevert(
      mintController.removeController(Accounts.controller1Account, {
        from: Accounts.arbitraryAccount,
      })
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt010 removeMinter reverts when msg.sender is not a controller", async function () {
    await expectError(
      mintController.removeMinter({ from: Accounts.controller1Account }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("bt011 removeMinter sets minters[M] to 0", async function () {
    // add a minter
    const amount = 789;
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
    expectedTokenState.pop();
    expectedTokenState.pop();
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt012 configureMinter reverts when msg.sender is not a controller", async function () {
    await expectError(
      mintController.configureMinter(50, { from: Accounts.controller1Account }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("bt013 configureMinter works when controllers[msg.sender]=M", async function () {
    // add a controller
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );

    // now configure minter
    const amount = 6789;
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
  });

  it("bt014 incrementMinterAllowance reverts if msg.sender is not a controller", async function () {
    await expectError(
      mintController.incrementMinterAllowance(50, {
        from: Accounts.controller1Account,
      }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("bt015 incrementMinterAllowance works when controllers[msg.sender]=M", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    // now configure minter
    const amount = 6789;
    await mintController.incrementMinterAllowance(amount, {
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
  });

  it("bt016 Constructor sets all controllers to 0", async function () {
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt017 removeController reverts when controllers[C] is 0", async function () {
    //  "remove" a controller that does not exist
    await expectError(
      mintController.removeController(Accounts.controller1Account, {
        from: Accounts.mintOwnerAccount,
      }),
      "Worker must be a non-zero address"
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt018 removeController removes an arbitrary controller", async function () {
    // add a controller
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

    // now remove it
    await mintController.removeController(Accounts.controller1Account, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.controllers.controller1Account = zeroAddress;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt019 configureController works when controller[C]=0", async function () {
    // note: this is a duplicate of bt004
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
  });

  it("bt020 configureController works when controller[C] != 0", async function () {
    // set controllers[controller1Account]=minterAccount
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

    // now set controllers[controller1Account]=arbitraryAccount
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.arbitraryAccount,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt021 configureController(C,C) works", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.controller1Account,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.controller1Account;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt022 configureController works when setting controller[C]=msg.sender", async function () {
    await mintController.configureController(
      Accounts.mintOwnerAccount,
      Accounts.controller1Account,
      { from: Accounts.mintOwnerAccount }
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.mintOwnerAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt023 configureController(C, newM) works when controller[C]=newM", async function () {
    // set controllers[controller1Account]=minterAccount
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

    // now set controllers[controller1Account]=minterAccount
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt024 Constructor sets minterManager", async function () {
    const minterManagerAddress = await mintController.getMinterManager();
    assert.isTrue(addressEquals(token.address, minterManagerAddress));
  });

  it("bt026 setMinterManager(x) works when existing minterManager != 0", async function () {
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt027 setMinterManager(x) works when x = msg.sender", async function () {
    await mintController.setMinterManager(Accounts.mintOwnerAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.mintOwnerAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt028 setMinterManager(x) works when x = minterManager", async function () {
    const minterManagerAddress = await mintController.getMinterManager();
    await mintController.setMinterManager(minterManagerAddress, {
      from: Accounts.mintOwnerAccount,
    });
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt030 removeMinter reverts when minterManager is 0", async function () {
    // set minterManager
    const minterManagerAddress = await mintController.getMinterManager();
    await mintController.setMinterManager(minterManagerAddress, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = minterManagerAddress;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // configure minter will fail with any args
    await expectRevert(
      mintController.removeMinter({ from: Accounts.controller1Account })
    );
  });

  it("bt031 removeMinter reverts when minterManager is a user account", async function () {
    // set minterManager to user account
    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // configure minter will fail with any args
    await expectRevert(
      mintController.removeMinter({ from: Accounts.controller1Account })
    );
  });

  it("bt032 removeMinter works when minterManager is ok", async function () {
    // add a minter
    const amount = 3;
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
    expectedTokenState.pop();
    expectedTokenState.pop();
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt034 configureMinter reverts when minterManager is a user account", async function () {
    // set minterManager to user account
    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // configure minter will fail with any args
    await expectRevert(
      mintController.configureMinter(50, { from: Accounts.controller1Account })
    );
  });

  it("bt035 configureMinter works when minterManager is ok", async function () {
    const amount = 456;
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
  });

  it("bt037 incrementMinterAllowance reverts when minterManager is a user account", async function () {
    // set minterManager to user account
    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // incrementMinterAllowance will fail with any args
    await expectRevert(
      mintController.incrementMinterAllowance(50, {
        from: Accounts.controller1Account,
      })
    );
  });

  it("bt038 incrementMinterAllowance works when minterManager is ok", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    // now incrementMinterAllowance
    const amount = 45;
    await mintController.incrementMinterAllowance(amount, {
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
  });

  it("bt039 configureMinter(M, amt) works when minterManager.isMinter(M)=false", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);
    assert.isFalse(isMinter);

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
  });

  it("bt040 configureMinter(M, amt) works when minterManager.isMinter(M)=true", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);
    assert.isTrue(isMinter);

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
  });

  it("bt041 removeMinter(M) works when minterManager.isMinter(M)=false", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);
    assert.isFalse(isMinter);

    await mintController.removeMinter({ from: Accounts.controller1Account });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt042 removeMinter(M) works when minterManager.isMinter(M)=true", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);
    assert.isTrue(isMinter);

    await mintController.removeMinter({ from: Accounts.controller1Account });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt043 incrementMinterAllowance(M, amt) reverts when minterManager.isMinter(M)=false", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);
    assert.isFalse(isMinter);

    await expectError(
      mintController.incrementMinterAllowance(amount, {
        from: Accounts.controller1Account,
      }),
      "Can only increment allowance for minters in minterManager"
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt044 incrementMinterAllowance(M, amt) works when minterManager.isMinter(M)=true", async function () {
    const amount = 65424;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);
    assert.isTrue(isMinter);

    await mintController.incrementMinterAllowance(amount, {
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
  });

  it("bt045 constructor - minterManager.isMinter[ALL] is false", async function () {
    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );

    const isMinterMappingEval = async function (accountAddress) {
      return await minterManager.isMinter(accountAddress);
    };

    const isMinterResults = await getAccountState(
      isMinterMappingEval,
      Accounts
    );
    for (const account in Accounts) {
      assert.isFalse(isMinterResults[account]);
    }
  });

  it("bt046 constructor - minterManager.minterAllowance[ALL] = 0", async function () {
    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );

    const minterAllowanceMapping = async function (accountAddress) {
      return await minterManager.minterAllowance(accountAddress);
    };

    const minterAllowanceResults = await getAccountState(
      minterAllowanceMapping,
      Accounts
    );
    for (const account in Accounts) {
      assert(minterAllowanceResults[account].isZero());
    }
  });

  it("bt047 incrementMinterAllowance(M,amt) works when minterAllowance is 0", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.isZero());

    await mintController.incrementMinterAllowance(amount, {
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
  });

  it("bt048 incrementMinterAllowance(M, amt) works when minterAllowance > 0", async function () {
    const initialAmount = 987341;
    const incrementAmount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(initialAmount, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.cmp(newBigNumber(initialAmount)) === 0);

    await mintController.incrementMinterAllowance(incrementAmount, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(initialAmount + incrementAmount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt049 incrementMinterAllowance(M,amt) reverts when minterAllowance[M] + amt > 2^256", async function () {
    const initialAmount =
      "0x" + newBigNumber(maxAmount).sub(newBigNumber(45)).toString(16, 64);
    const incrementAmount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(initialAmount, {
      from: Accounts.controller1Account,
    });

    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(initialAmount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    await expectRevert(
      mintController.incrementMinterAllowance(incrementAmount, {
        from: Accounts.controller1Account,
      })
    );
  });

  it("bt050 configureMinter(M,amt) works when minterAllowance=0", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.cmp(newBigNumber(0)) === 0);

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
  });

  it("bt051 configureMinter(M,amt) works when minterAllowance>0", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.cmp(newBigNumber(amount)) === 0);

    await mintController.configureMinter(2 * amount, {
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

  it("bt052 configureMinter(M,amt) works when amt+minterAllowance > 2^256", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(maxAmount, {
      from: Accounts.controller1Account,
    });

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
  });

  it("bt053 removeMinter works when the minterAllowance is 0", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(0, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.isZero());

    await mintController.removeMinter({ from: Accounts.controller1Account });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt054 removeMinter works when the minterAllowance is not zero", async function () {
    const amount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.cmp(newBigNumber(amount)) === 0);

    await mintController.removeMinter({ from: Accounts.controller1Account });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt055 removeMinter works when the minterAllowance is big", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(maxAmount, {
      from: Accounts.controller1Account,
    });

    await mintController.removeMinter({ from: Accounts.controller1Account });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt056 decrementMinterAllowance reverts if msg.sender is not a controller", async function () {
    await expectError(
      mintController.decrementMinterAllowance(0, {
        from: Accounts.controller1Account,
      }),
      "The value of controllers[msg.sender] must be non-zero"
    );
  });

  it("bt057 decrementMinterAllowance works when controllers[msg.sender]=M", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(6789, {
      from: Accounts.controller1Account,
    });

    // now configure minter
    const amount = 1;
    await mintController.decrementMinterAllowance(amount, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(6788),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt058 decrementMinterAllowance reverts when minterManager is 0", async function () {
    // set minterManager to zero
    await mintController.setMinterManager(zeroAddress, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = zeroAddress;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // decrementMinterAllowance will fail with any args
    await expectRevert(
      mintController.decrementMinterAllowance(1, {
        from: Accounts.controller1Account,
      })
    );
  });

  it("bt059 decrementMinterAllowance reverts when minterManager is a user account", async function () {
    // set minterManager to user account
    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );

    // decrementMinterAllowance will fail with any args
    await expectRevert(
      mintController.decrementMinterAllowance(1, {
        from: Accounts.controller1Account,
      })
    );
  });

  it("bt060 decrementMinterAllowance works when minterManager is ok", async function () {
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(45, {
      from: Accounts.controller1Account,
    });

    // now decrementMinterAllowance
    const amount = 45;
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

  it("bt061 decrementMinterAllowance(M, amt) reverts when minterManager.isMinter(M)=false", async function () {
    const amount = 1;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);

    assert.isFalse(isMinter);

    await expectError(
      mintController.decrementMinterAllowance(amount, {
        from: Accounts.controller1Account,
      }),
      "Can only decrement allowance for minters in minterManager"
    );
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt062 decrementMinterAllowance(M, amt) works when minterManager.isMinter(M)=true", async function () {
    const amount = 65424;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const isMinter = await minterManager.isMinter(Accounts.minterAccount);
    assert.isTrue(isMinter);

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

  it("bt063 decrementMinterAllowance(M,amt) works when minterAllowance is MAX", async function () {
    const amount = maxAmount;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(amount, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.cmp(newBigNumber(maxAmount)) === 0);
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

  it("bt064 decrementMinterAllowance(M, amt) works when minterAllowance > 0", async function () {
    const initialAmount = 987341;
    const decrementAmount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(initialAmount, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.cmp(newBigNumber(initialAmount)) === 0);

    await mintController.decrementMinterAllowance(decrementAmount, {
      from: Accounts.controller1Account,
    });
    expectedMintControllerState.controllers.controller1Account =
      Accounts.minterAccount;
    expectedTokenState.push(
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(initialAmount - decrementAmount),
      }
    );
    await checkMINTp0(
      [token, mintController],
      [expectedTokenState, expectedMintControllerState]
    );
  });

  it("bt065 decrementMinterAllowance(M,amt) sets allowance to 0 when minterAllowance[M] - amt < 0", async function () {
    const initialAmount = 45;
    const decrementAmount = 64;
    await mintController.configureController(
      Accounts.controller1Account,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(initialAmount, {
      from: Accounts.controller1Account,
    });

    const minterManager = await FiatToken.at(
      await mintController.getMinterManager()
    );
    const minterAllowance = await minterManager.minterAllowance(
      Accounts.minterAccount
    );
    assert(minterAllowance.cmp(newBigNumber(initialAmount)) === 0);
    await mintController.decrementMinterAllowance(decrementAmount, {
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
}

const wrapTests = require("../v1/helpers/wrapTests");
wrapTests("MINTp0_BasicTests MintController", run_tests_MintController);
wrapTests("MINTp0_BasicTests MasterMinter", run_tests_MasterMinter);
