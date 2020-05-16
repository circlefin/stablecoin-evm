import { assert } from "chai";

export async function expectRevert(
  promise: Promise<unknown>,
  reason?: string | RegExp
): Promise<void> {
  let err: Error | undefined;
  try {
    await promise;
  } catch (e) {
    err = e;
  }

  if (!err) {
    assert.fail("Exception not thrown");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errMsg: string = (err as any).hijackedMessage ?? err.message;
  assert.match(errMsg, /revert/i);

  if (!reason) {
    return;
  } else if (reason instanceof RegExp) {
    assert.match(errMsg, reason);
  } else {
    assert.include(errMsg, reason);
  }
}
