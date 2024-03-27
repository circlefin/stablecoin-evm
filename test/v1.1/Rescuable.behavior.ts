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

import { expectRevert } from "../helpers";
import { DummyERC20Instance, RescuableInstance } from "../../@types/generated";
import { HARDHAT_ACCOUNTS, ZERO_ADDRESS } from "../helpers/constants";
const DummyERC20 = artifacts.require("DummyERC20");

export function behavesLikeRescuable(
  getContract: () => RescuableInstance
): void {
  describe("behaves like a Rescuable", () => {
    const accounts = HARDHAT_ACCOUNTS;

    let rescuable: RescuableInstance;
    let owner: string;

    beforeEach(async () => {
      rescuable = getContract();
      owner = await rescuable.owner();
    });

    describe("updateRescuer", () => {
      it("allows owner to change rescuer", async () => {
        await rescuable.updateRescuer(accounts[1], { from: owner });
        const rescuer = await rescuable.rescuer();
        expect(rescuer).to.equal(accounts[1]);
      });

      it("does not allow non-owner to change rescuer", async () => {
        await expectRevert(
          rescuable.updateRescuer(accounts[1], { from: accounts[1] }),
          "caller is not the owner"
        );
      });

      it("does not allow updating the rescuer to the zero address", async () => {
        await expectRevert(
          rescuable.updateRescuer(ZERO_ADDRESS, { from: owner }),
          "new rescuer is the zero address"
        );
      });
    });

    describe("rescueERC20", () => {
      const rescuer = accounts[1];
      const tokenOwner = accounts[14];

      let token: DummyERC20Instance;

      beforeEach(async () => {
        await rescuable.updateRescuer(rescuer, { from: owner });
        token = await DummyERC20.new("Dummy", "DUMB", 1000, {
          from: tokenOwner,
        });

        // send some tokens to the contract
        await token.transfer(rescuable.address, 100, { from: tokenOwner });

        expect((await token.balanceOf(tokenOwner)).toNumber()).to.equal(900);
        expect((await token.balanceOf(rescuable.address)).toNumber()).to.equal(
          100
        );
      });

      it("allows rescuer to rescue ERC20 (full amount)", async () => {
        await rescuable.rescueERC20(token.address, tokenOwner, 100, {
          from: rescuer,
        });
        expect((await token.balanceOf(rescuable.address)).toNumber()).to.equal(
          0
        );
        expect((await token.balanceOf(tokenOwner)).toNumber()).to.equal(1000);
      });

      it("allows rescuer to rescue ERC20 (partial amount)", async () => {
        await rescuable.rescueERC20(token.address, tokenOwner, 50, {
          from: rescuer,
        });
        expect((await token.balanceOf(rescuable.address)).toNumber()).to.equal(
          50
        );
        expect((await token.balanceOf(tokenOwner)).toNumber()).to.equal(950);
      });

      it("reverts when the requested amount is greater than balance", async () => {
        await expectRevert(
          rescuable.rescueERC20(token.address, tokenOwner, 101, {
            from: rescuer,
          })
        );
      });

      it("reverts when the the given contract address is not ERC20", async () => {
        await expectRevert(
          rescuable.rescueERC20(accounts[3], tokenOwner, 1, {
            from: rescuer,
          })
        );
      });

      it("does not allow non-rescuer to rescue ERC20", async () => {
        await expectRevert(
          rescuable.rescueERC20(token.address, tokenOwner, 1, {
            from: tokenOwner,
          }),
          "caller is not the rescuer"
        );
        expect((await token.balanceOf(rescuable.address)).toNumber()).to.equal(
          100
        );
        expect((await token.balanceOf(tokenOwner)).toNumber()).to.equal(900);
      });
    });
  });
}
