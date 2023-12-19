/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2023, Circle Internet Financial, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
