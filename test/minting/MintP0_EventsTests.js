const MintController = artifacts.require("minting/MintController");
const MasterMinter = artifacts.require("minting/MasterMinter");

const mintUtils = require("./MintControllerUtils.js");
const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const initializeTokenWithProxyAndMintController =
  mintUtils.initializeTokenWithProxyAndMintController;

let rawToken;
let tokenConfig;
let token;
let mintController;

const mintControllerEvents = {
  ownershipTransferred: "OwnershipTransferred",
  controllerConfigured: "ControllerConfigured",
  controllerRemoved: "ControllerRemoved",
  minterManagerSet: "MinterManagerSet",
  minterCofigured: "MinterConfigured",
  minterRemoved: "MinterRemoved",
  minterAllowanceIncremented: "MinterAllowanceIncremented",
  minterAllowanceDecremented: "MinterAllowanceDecremented",
};

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
  });

  it("et100 transferOwnership emits OwnershipTransferred event", async function () {
    // get all previous transfer ownership events
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.ownershipTransferred,
      {
        filter: {
          previousOwner: Accounts.mintOwnerAccount,
          newOwner: Accounts.arbitraryAccount,
        },
      }
    );

    // now transfer ownership and test again
    await mintController.transferOwnership(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.ownershipTransferred,
      {
        filter: {
          previousOwner: Accounts.mintOwnerAccount,
          newOwner: Accounts.arbitraryAccount,
        },
      }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });

  it("et101 configureController emits ControllerConfigured event", async function () {
    // get all previous configure controller events
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.controllerConfigured,
      {
        filter: {
          _controller: Accounts.arbitraryAccount,
          _worker: Accounts.arbitraryAccount2,
        },
      }
    );

    // now configure controller and test again
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.arbitraryAccount2,
      { from: Accounts.mintOwnerAccount }
    );
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.controllerConfigured,
      {
        filter: {
          _controller: Accounts.arbitraryAccount,
          _worker: Accounts.arbitraryAccount2,
        },
      }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });

  it("et102 removeController emits ControllerRemoved event", async function () {
    // get all previous removeController events
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.arbitraryAccount2,
      { from: Accounts.mintOwnerAccount }
    );
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.controllerRemoved,
      { filter: { _controller: Accounts.arbitraryAccount } }
    );

    // now remove controller and test again
    await mintController.removeController(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.controllerRemoved,
      { filter: { _controller: Accounts.arbitraryAccount } }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });

  it("et103 setMinterManager emits MinterManagerSet event", async function () {
    // get all previous set minter manager events
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.minterManagerSet,
      {
        filter: {
          _oldMinterManager: token.address,
          _newMinterManager: Accounts.arbitraryAccount,
        },
      }
    );

    // now set minter manager and test again
    await mintController.setMinterManager(Accounts.arbitraryAccount, {
      from: Accounts.mintOwnerAccount,
    });
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.minterManagerSet,
      {
        filter: {
          _oldMinterManager: token.address,
          _newMinterManager: Accounts.arbitraryAccount,
        },
      }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });

  it("et104 removeMinter emits MinterRemoved event", async function () {
    // get all previous remove minter events
    const allowance = 10;
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(allowance, {
      from: Accounts.arbitraryAccount,
    });
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.minterRemoved,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
        },
      }
    );

    // now remove minter and test again
    await mintController.removeMinter({ from: Accounts.arbitraryAccount });
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.minterRemoved,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
        },
      }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });

  it("et105 configureMinter emits MinterConfigured event", async function () {
    // get all previous configureMinter events
    const allowance = 10;
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.minterCofigured,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
          _allowance: allowance,
        },
      }
    );

    // now transfer ownership and test again
    await mintController.configureMinter(allowance, {
      from: Accounts.arbitraryAccount,
    });
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.minterCofigured,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
          _allowance: allowance,
        },
      }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });

  it("et106 incrementMinterAllowance emits MinterAllowanceIncremented event", async function () {
    // get all previous increment minter allowance events
    const allowance = 10;
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(allowance, {
      from: Accounts.arbitraryAccount,
    });
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.minterAllowanceIncremented,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
          _increment: allowance,
          _newAllowance: allowance * 2,
        },
      }
    );

    // now increment minter allowance and test again
    await mintController.incrementMinterAllowance(allowance, {
      from: Accounts.arbitraryAccount,
    });
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.minterAllowanceIncremented,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
          _increment: allowance,
          _newAllowance: allowance * 2,
        },
      }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });

  it("et107 decrementMinterAllowance emits MinterAllowanceDecremented event", async function () {
    // get all previous decrement minter allowance events
    const allowance = 10;
    await mintController.configureController(
      Accounts.arbitraryAccount,
      Accounts.minterAccount,
      { from: Accounts.mintOwnerAccount }
    );
    await mintController.configureMinter(allowance, {
      from: Accounts.arbitraryAccount,
    });
    const preEvents = await mintController.getPastEvents(
      mintControllerEvents.minterAllowanceDecremented,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
          _decrement: allowance,
          _newAllowance: 0,
        },
      }
    );

    // now decrement minter allowance and test again
    await mintController.decrementMinterAllowance(allowance, {
      from: Accounts.arbitraryAccount,
    });
    const postEvents = await mintController.getPastEvents(
      mintControllerEvents.minterAllowanceDecremented,
      {
        filter: {
          _msgSender: Accounts.arbitraryAccount,
          _minter: Accounts.minterAccount,
          _decrement: allowance,
          _newAllowance: 0,
        },
      }
    );

    // one new event must have fired
    assert.equal(preEvents.length + 1, postEvents.length);
  });
}

const wrapTests = require("../v1/helpers/wrapTests");
wrapTests("MINTp0_EventTests MintController", run_tests_MintController);
wrapTests("MINTp0_EventTests MasterMinter", run_tests_MasterMinter);
