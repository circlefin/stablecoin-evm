import { FiatTokenV2Instance } from "../../@types/generated";
import { Approval } from "../../@types/generated/FiatTokenV2";
import { expectRevert } from "../helpers";
import { MAX_UINT256 } from "../helpers/constants";

export function hasSafeAllowance(
  getFiatToken: () => FiatTokenV2Instance,
  fiatTokenOwner: string,
  accounts: Truffle.Accounts
): void {
  describe("safe allowance", () => {
    let fiatToken: FiatTokenV2Instance;
    const [alice, bob] = accounts;

    beforeEach(() => {
      fiatToken = getFiatToken();
    });

    describe("increaseAllowance", () => {
      it("increases allowance by a given increment", async () => {
        // increase allowance by 10e6
        let result = await fiatToken.increaseAllowance(bob, 10e6, {
          from: alice,
        });
        let log = result.logs[0] as Truffle.TransactionLog<Approval>;

        // check that allowance is now 10e6
        expect((await fiatToken.allowance(alice, bob)).toNumber()).to.equal(
          10e6
        );
        // check that Approval event is emitted
        expect(log.event).to.equal("Approval");
        expect(log.args[0]).to.equal(alice);
        expect(log.args[1]).to.equal(bob);
        expect(log.args[2].toNumber()).to.equal(10e6);

        // increase allowance by another 5e6
        result = await fiatToken.increaseAllowance(bob, 5e6, { from: alice });
        log = result.logs[0] as Truffle.TransactionLog<Approval>;

        // check that allowance is now 15e6
        expect((await fiatToken.allowance(alice, bob)).toNumber()).to.equal(
          15e6
        );
        // check that Approval event is emitted
        expect(log.event).to.equal("Approval");
        expect(log.args[0]).to.equal(alice);
        expect(log.args[1]).to.equal(bob);
        expect(log.args[2].toNumber()).to.equal(15e6);
      });

      it("reverts if the increase causes an integer overflow", async () => {
        await fiatToken.increaseAllowance(bob, 1, {
          from: alice,
        });

        await expectRevert(
          fiatToken.increaseAllowance(bob, MAX_UINT256, {
            from: alice,
          }),
          "addition overflow"
        );
      });

      it("reverts if the contract is paused", async () => {
        // pause the contract
        await fiatToken.pause({ from: fiatTokenOwner });

        // try to increase allowance
        await expectRevert(
          fiatToken.increaseAllowance(bob, 1, { from: alice }),
          "paused"
        );
      });

      it("reverts if either the owner or the spender is blacklisted", async () => {
        // owner is blacklisted
        await fiatToken.blacklist(alice, { from: fiatTokenOwner });

        // try to increase allowance
        await expectRevert(
          fiatToken.increaseAllowance(bob, 1, { from: alice }),
          "account is blacklisted"
        );

        // spender is blacklisted
        await fiatToken.unBlacklist(alice, { from: fiatTokenOwner });
        await fiatToken.blacklist(bob, { from: fiatTokenOwner });

        // try to increase allowance
        await expectRevert(
          fiatToken.increaseAllowance(bob, 1, { from: alice }),
          "account is blacklisted"
        );
      });
    });

    describe("decreaseAllowance", () => {
      beforeEach(async () => {
        // set initial allowance to be 10e6
        await fiatToken.approve(bob, 10e6, { from: alice });
      });

      it("decreases allowance by a given decrement", async () => {
        // decrease allowance by 8e6
        let result = await fiatToken.decreaseAllowance(bob, 8e6, {
          from: alice,
        });
        let log = result.logs[0] as Truffle.TransactionLog<Approval>;

        // check that allowance is now 2e6
        expect((await fiatToken.allowance(alice, bob)).toNumber()).to.equal(
          2e6
        );
        // check that Approval event is emitted
        expect(log.event).to.equal("Approval");
        expect(log.args[0]).to.equal(alice);
        expect(log.args[1]).to.equal(bob);
        expect(log.args[2].toNumber()).to.equal(2e6);

        // increase allowance by another 2e6
        result = await fiatToken.decreaseAllowance(bob, 2e6, { from: alice });
        log = result.logs[0] as Truffle.TransactionLog<Approval>;

        // check that allowance is now 0
        expect((await fiatToken.allowance(alice, bob)).toNumber()).to.equal(0);
        // check that Approval event is emitted
        expect(log.event).to.equal("Approval");
        expect(log.args[0]).to.equal(alice);
        expect(log.args[1]).to.equal(bob);
        expect(log.args[2].toNumber()).to.equal(0);
      });

      it("reverts if the decrease is greater than current allowance", async () => {
        // try to decrease allowance by 10e6 + 1
        await expectRevert(
          fiatToken.decreaseAllowance(bob, 10e6 + 1, {
            from: alice,
          }),
          "decreased allowance below zero"
        );
      });

      it("reverts if the decrease causes an integer overflow", async () => {
        // a subtraction causing overflow does not actually happen because
        // it catches that the given decrement is greater than the current
        // allowance
        await expectRevert(
          fiatToken.decreaseAllowance(bob, MAX_UINT256, {
            from: alice,
          }),
          "decreased allowance below zero"
        );
      });

      it("reverts if the contract is paused", async () => {
        // pause the contract
        await fiatToken.pause({ from: fiatTokenOwner });

        // try to decrease the allowance
        await expectRevert(
          fiatToken.decreaseAllowance(bob, 1, { from: alice }),
          "paused"
        );
      });

      it("reverts if either the owner or the spender is blacklisted", async () => {
        // owner is blacklisted
        await fiatToken.blacklist(alice, { from: fiatTokenOwner });

        // try to decrease allowance
        await expectRevert(
          fiatToken.decreaseAllowance(bob, 1, { from: alice }),
          "account is blacklisted"
        );

        // spender is blacklisted
        await fiatToken.unBlacklist(alice, { from: fiatTokenOwner });
        await fiatToken.blacklist(bob, { from: fiatTokenOwner });

        // try to decrease allowance
        await expectRevert(
          fiatToken.decreaseAllowance(bob, 1, { from: alice }),
          "account is blacklisted"
        );
      });
    });
  });
}
