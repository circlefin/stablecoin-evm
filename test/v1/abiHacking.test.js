/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
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

const wrapTests = require("./helpers/wrapTests");
const {
  expectRevert,
  checkVariables,
  initializeTokenWithProxy,
  arbitraryAccount,
  pauserAccount,
  tokenOwnerAccount,
  arbitraryAccountPrivateKey,
  tokenOwnerPrivateKey,
  pauserAccountPrivateKey,
} = require("./helpers/tokenTest");
const {
  makeRawTransaction,
  sendRawTransaction,
  functionSignature,
  encodeAddress,
  encodeUint,
  msgData,
} = require("./helpers/abi");

// Encodes methodName, 32 byte string of 0, and address.
function mockStringAddressEncode(methodName, address) {
  const version = encodeUint(32) + encodeUint(0); // encode 32 byte string of 0's
  return functionSignature(methodName) + version + encodeAddress(address);
}

function runTests(newToken) {
  let proxy, token;

  beforeEach(async () => {
    const rawToken = await newToken();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  // sanity check for pausable
  it("abi004 FiatToken pause() is public", async () => {
    const badData = functionSignature("pause()");
    const raw = await makeRawTransaction(
      badData,
      pauserAccount,
      pauserAccountPrivateKey,
      token.address
    );
    await sendRawTransaction(raw);
    const customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
  });

  it("abi040 Blacklistable constructor is not a function", async () => {
    const badData = functionSignature("Blacklistable()");
    const raw = await makeRawTransaction(
      badData,
      pauserAccount,
      pauserAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi042 Ownable constructor is not a function", async () => {
    const badData = functionSignature("Ownable()");
    const raw = await makeRawTransaction(
      badData,
      pauserAccount,
      pauserAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi005 Pausable constructor is not a function", async () => {
    const badData = functionSignature("Pausable()");
    const raw = await makeRawTransaction(
      badData,
      pauserAccount,
      pauserAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi043 FiatTokenProxy constructor is not a function", async () => {
    const badData = functionSignature("FiatTokenProxy()");
    const raw = await makeRawTransaction(
      badData,
      pauserAccount,
      pauserAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi027 UpgradeabilityProxy constructor", async () => {
    const badData = msgData("UpgradeabilityProxy(address)", arbitraryAccount);
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi055 Proxy constructor is not a function", async () => {
    const badData = functionSignature("Proxy()");
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi056 Proxy _delegate is internal", async () => {
    const badData = msgData("_delegate(address)", arbitraryAccount);
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi057 Proxy _willFallback is internal", async () => {
    const badData = functionSignature("_willFallback()");
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi058 Proxy _fallback is internal", async () => {
    const badData = functionSignature("_fallback()");
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi050 Upgradeability implementation is internal", async () => {
    const badData = msgData("UpgradeabilityProxy(address)", arbitraryAccount);
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi051 AdminUpgradeabillityProxy constructor is not a function", async () => {
    const badData = msgData(
      "AdminUpgradeabillityProxy(address)",
      arbitraryAccount
    );
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi053 AdminUpgradeabillityProxy _setAdmin is internal", async () => {
    const badData = msgData(
      "AdminUpgradeabillityProxy(address)",
      arbitraryAccount
    );
    const raw = await makeRawTransaction(
      badData,
      arbitraryAccount,
      arbitraryAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi041 FiatToken constructor is not a function", async () => {
    const badData = functionSignature("FiatToken()");
    const raw = await makeRawTransaction(
      badData,
      pauserAccount,
      pauserAccountPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi025 setOwner is internal", async () => {
    const badData = msgData("setOwner(address)", pauserAccount);
    const raw = await makeRawTransaction(
      badData,
      tokenOwnerAccount,
      tokenOwnerPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });

  it("abi028 UpgradeabilityProxy._upgradeTo is internal", async () => {
    const badData = mockStringAddressEncode(
      "_upgradeTo(string,address)",
      pauserAccount
    );
    const raw = await makeRawTransaction(
      badData,
      tokenOwnerAccount,
      tokenOwnerPrivateKey,
      token.address
    );
    await expectRevert(sendRawTransaction(raw));
  });
}

wrapTests("FiatToken ABI hacking", runTests);
