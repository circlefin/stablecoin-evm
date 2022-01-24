import BN from "bn.js";

const nullAccount = "0x0000000000000000000000000000000000000000";

export function checkFreezeEvents(
  freezing: Truffle.TransactionResponse<Truffle.AnyEvent>,
  amount: number,
  targetAccount: string
): void {
  // BalanceFrozen Event
  assert.strictEqual(freezing.logs[0].event, "BalanceFrozen");
  assert.strictEqual(freezing.logs[0].args._account, targetAccount);
  assert.isTrue(freezing.logs[0].args.amountFrozen.eq(new BN(amount)));

  // Transfer to 0 Event
  assert.strictEqual(freezing.logs[1].event, "Transfer");
  assert.strictEqual(freezing.logs[1].args.from, targetAccount);
  assert.strictEqual(freezing.logs[1].args.to, nullAccount);
  assert.isTrue(freezing.logs[1].args.value.eq(new BN(amount)));
}

export function checkUnfreezeEvents(
  unfreezing: Truffle.TransactionResponse<Truffle.AnyEvent>,
  amount: number,
  targetAccount: string
): void {
  // BalanceUnfrozen Event
  assert.strictEqual(unfreezing.logs[0].event, "BalanceUnfrozen");
  assert.strictEqual(unfreezing.logs[0].args._account, targetAccount);
  assert.isTrue(unfreezing.logs[0].args.amountUnfrozen.eq(new BN(amount)));

  // Transfer from 0 Event
  assert.strictEqual(unfreezing.logs[1].event, "Transfer");
  assert.strictEqual(unfreezing.logs[1].args.from, nullAccount);
  assert.strictEqual(unfreezing.logs[1].args.to, targetAccount);
  assert.isTrue(unfreezing.logs[1].args.value.eq(new BN(amount)));
}
