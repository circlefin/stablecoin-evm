import { RescuableInstance } from "../../@types/generated/Rescuable";
import { expectRevert } from "../helpers";
import { DummyErc20Instance } from "../../@types/generated";
import { ZERO_ADDRESS } from "../helpers/constants";
const DummyERC20 = artifacts.require("DummyERC20");

export function behavesLikeRescuable(
  getContract: () => RescuableInstance,
  accounts: Truffle.Accounts
): void {
  describe("behaves like a Rescuable", () => {
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
      let rescuer: string;
      let tokenOwner: string;
      let token: DummyErc20Instance;

      beforeEach(async () => {
        rescuer = accounts[1];
        await rescuable.updateRescuer(rescuer, { from: owner });

        tokenOwner = accounts[14];
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
