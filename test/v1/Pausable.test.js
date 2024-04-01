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

const {
  expectRevert,
  deployerAccount,
  arbitraryAccount,
  pauserAccount,
} = require("./helpers/tokenTest");

const Pausable = artifacts.require("Pausable");

describe("Pausable", () => {
  let pausable;

  beforeEach(async () => {
    pausable = await Pausable.new({ from: deployerAccount });
    await pausable.updatePauser(pauserAccount, { from: deployerAccount });
  });

  it("constructor owner", async () => {
    const actualOwner = await pausable.owner.call();
    assert.strictEqual(deployerAccount, actualOwner, "wrong owner");
  });

  it("constructor pauser", async () => {
    const actualOwner = await pausable.pauser.call();
    assert.strictEqual(pauserAccount, actualOwner, "wrong pauser");
  });

  it("paused after pausing", async () => {
    await checkUnPaused();

    await pausable.pause({ from: pauserAccount });
    await checkPaused();

    // should stay paused even if we call it again
    await pausable.pause({ from: pauserAccount });
    await checkPaused();

    await pausable.unpause({ from: pauserAccount });
    await checkUnPaused();
  });

  it("update pauser", async () => {
    // pause from original pauser
    await pausable.pause({ from: pauserAccount });
    await checkPaused("should have paused from original pauser account");

    await pausable.updatePauser(arbitraryAccount, { from: deployerAccount });
    const newPauser = await pausable.pauser.call();
    assert.strictEqual(arbitraryAccount, newPauser);
    // double check we're still paused
    await checkPaused("should still be paused after changing pauser");

    await pausable.unpause({ from: arbitraryAccount });
    await checkUnPaused();

    // original pauser shouldn't work anymore
    await expectRevert(pausable.pause({ from: pauserAccount }));
  });

  it("fail to update pauser from wrong account", async () => {
    await expectRevert(
      pausable.updatePauser(arbitraryAccount, { from: arbitraryAccount })
    );
  });

  it("fail to pause from wrong account", async () => {
    await expectRevert(pausable.pause({ from: arbitraryAccount }));
  });

  it("fail to unpause from wrong account", async () => {
    await pausable.pause({ from: pauserAccount });
    await checkPaused();

    await expectRevert(pausable.unpause({ from: arbitraryAccount }));
  });

  async function checkPaused(msg) {
    const paused = await pausable.paused.call();
    assert.isTrue(paused, msg);
  }

  async function checkUnPaused(msg) {
    const paused = await pausable.paused.call();
    assert.isFalse(paused, msg);
  }
});
