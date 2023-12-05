// SPDX-License-Identifier: MIT
//
// Copyright (c) 2018-2023 CENTRE SECZ
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

import sinon from "sinon";
import { generateAccounts, initializeToVersion } from "../helpers";

import proxyquire from "proxyquire";
import type { validateAccountsToBlacklist as validateAccountsToBlacklistFnType } from "../../scripts/validateAccountsToBlacklist.js";
import { accounts } from "../helpers/constants";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV1 = artifacts.require("FiatTokenV1");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

contract("Test script to validate accounts to blacklist", () => {
  const LOCAL_RPC_URL = "http://localhost:8545";
  const DATASOURCE_FILE_PATH = "blacklist.datasource.json";

  let validateAccountsToBlacklist: typeof validateAccountsToBlacklistFnType;
  let readBlacklistFileStub: sinon.SinonStub<any[], any>;

  let blacklistedAccounts: string[];
  let fiatTokenV1Address: string;
  let proxyAddress: string;

  beforeEach(async () => {
    const fiatTokenV1 = await FiatTokenV1.new();
    const proxy = await FiatTokenProxy.new(fiatTokenV1.address, {
      from: accounts.proxyOwnerAccount,
    });
    await initializeToVersion(
      proxy,
      "1",
      accounts.tokenOwnerAccount,
      accounts.lostAndFoundAccount
    );

    fiatTokenV1Address = fiatTokenV1.address;
    proxyAddress = proxy.address;

    const proxyAsV1 = await FiatTokenV1.at(proxyAddress);
    blacklistedAccounts = generateAccounts(10);
    for (const account of blacklistedAccounts) {
      await proxyAsV1.blacklist(account, {
        from: accounts.tokenOwnerAccount,
      });
    }

    readBlacklistFileStub = sinon.stub();
    validateAccountsToBlacklist = proxyquire(
      "../../scripts/validateAccountsToBlacklist.js",
      { "../utils": { readBlacklistFile: readBlacklistFileStub } }
    )["validateAccountsToBlacklist"];
  });

  afterEach(() => {
    sinon.restore();
  });

  async function setupTest(
    blacklistLocal: string[],
    blacklistDatasource: string[],
    blacklistUpgrader: string[]
  ): Promise<{ v2_2UpgraderAddress: string }> {
    readBlacklistFileStub
      .withArgs(sinon.match("blacklist.remote.json"))
      .returns(blacklistLocal);
    readBlacklistFileStub
      .withArgs(sinon.match(DATASOURCE_FILE_PATH))
      .returns(blacklistDatasource);

    // Only the `blacklistUpgrader` parameter is relevant to the test.
    const v2_2Upgrader = await V2_2Upgrader.new(
      proxyAddress,
      fiatTokenV1Address,
      accounts.proxyOwnerAccount,
      blacklistUpgrader,
      "USDC"
    );
    return { v2_2UpgraderAddress: v2_2Upgrader.address };
  }

  it("should succeed if every source's states are the same", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const { v2_2UpgraderAddress } = await setupTest(
      blacklistedAccounts,
      blacklistedAccounts,
      blacklistedAccounts
    );

    await validateAccountsToBlacklist(
      LOCAL_RPC_URL,
      proxyAddress,
      v2_2UpgraderAddress,
      DATASOURCE_FILE_PATH,
      skipDatasourceValidation,
      skipUpgraderValidation
    );
  });

  it("should throw if the expected state is non unique", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const { v2_2UpgraderAddress } = await setupTest(
      blacklistedAccounts.concat(blacklistedAccounts.slice(0, 1)),
      blacklistedAccounts,
      blacklistedAccounts
    );

    try {
      await validateAccountsToBlacklist(
        LOCAL_RPC_URL,
        proxyAddress,
        v2_2UpgraderAddress,
        DATASOURCE_FILE_PATH,
        skipDatasourceValidation,
        skipUpgraderValidation
      );
    } catch (e) {
      assert((e as Error).message.includes("duplicates detected in array!"));
    }
  });

  it("should throw if the datasource state is non unique", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const { v2_2UpgraderAddress } = await setupTest(
      blacklistedAccounts,
      blacklistedAccounts.concat(blacklistedAccounts.slice(0, 1)),
      blacklistedAccounts
    );

    try {
      await validateAccountsToBlacklist(
        LOCAL_RPC_URL,
        proxyAddress,
        v2_2UpgraderAddress,
        DATASOURCE_FILE_PATH,
        skipDatasourceValidation,
        skipUpgraderValidation
      );
    } catch (e) {
      assert((e as Error).message.includes("duplicates detected in array!"));
    }
  });

  it("should throw if the datasource state is wrong - different length", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const { v2_2UpgraderAddress } = await setupTest(
      blacklistedAccounts,
      [],
      blacklistedAccounts
    );

    try {
      await validateAccountsToBlacklist(
        LOCAL_RPC_URL,
        proxyAddress,
        v2_2UpgraderAddress,
        DATASOURCE_FILE_PATH,
        skipDatasourceValidation,
        skipUpgraderValidation
      );
    } catch (e) {
      assert((e as Error).message.includes("Arrays have different lengths!"));
    }
  });

  it("should throw if the datasource state is wrong - same length, different content", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const { v2_2UpgraderAddress } = await setupTest(
      blacklistedAccounts,
      generateAccounts(1).concat(blacklistedAccounts.slice(1)),
      blacklistedAccounts
    );

    try {
      await validateAccountsToBlacklist(
        LOCAL_RPC_URL,
        proxyAddress,
        v2_2UpgraderAddress,
        DATASOURCE_FILE_PATH,
        skipDatasourceValidation,
        skipUpgraderValidation
      );
    } catch (e) {
      assert(
        (e as Error).message.match(/Account '.*' not found in accountsArray!/)
      );
    }
  });

  it("should throw if the upgrader state is wrong - different length", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const { v2_2UpgraderAddress } = await setupTest(
      blacklistedAccounts,
      blacklistedAccounts,
      []
    );

    try {
      await validateAccountsToBlacklist(
        LOCAL_RPC_URL,
        proxyAddress,
        v2_2UpgraderAddress,
        DATASOURCE_FILE_PATH,
        skipDatasourceValidation,
        skipUpgraderValidation
      );
    } catch (e) {
      assert((e as Error).message.includes("Arrays have different lengths!"));
    }
  });

  it("should throw if the upgrader state is wrong - same length, different content", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const { v2_2UpgraderAddress } = await setupTest(
      blacklistedAccounts,
      blacklistedAccounts,
      generateAccounts(1).concat(blacklistedAccounts.slice(1))
    );

    try {
      await validateAccountsToBlacklist(
        LOCAL_RPC_URL,
        proxyAddress,
        v2_2UpgraderAddress,
        DATASOURCE_FILE_PATH,
        skipDatasourceValidation,
        skipUpgraderValidation
      );
    } catch (e) {
      assert(
        (e as Error).message.match(/Account '.*' not found in accountsArray!/)
      );
    }
  });

  it("should throw if the local state is wrong - non blacklisted account", async () => {
    const skipDatasourceValidation = false;
    const skipUpgraderValidation = false;

    const incorrectBlacklist = generateAccounts(1).concat(
      blacklistedAccounts.slice(1)
    );
    const { v2_2UpgraderAddress } = await setupTest(
      incorrectBlacklist,
      incorrectBlacklist,
      incorrectBlacklist
    );

    try {
      await validateAccountsToBlacklist(
        LOCAL_RPC_URL,
        proxyAddress,
        v2_2UpgraderAddress,
        DATASOURCE_FILE_PATH,
        skipDatasourceValidation,
        skipUpgraderValidation
      );
    } catch (e) {
      assert(
        (e as Error).message.match(/Account '.*' is not currently blacklisted!/)
      );
    }
  });
});
