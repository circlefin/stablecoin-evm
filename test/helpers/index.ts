import { ecsign } from "ethereumjs-util";
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

export function prepend0x(v: string): string {
  return v.replace(/^(0x)?/, "0x");
}

export function strip0x(v: string): string {
  return v.replace(/^0x/, "");
}

export function hexStringFromBuffer(buf: Buffer): string {
  return "0x" + buf.toString("hex");
}

export function bufferFromHexString(hex: string): Buffer {
  return Buffer.from(strip0x(hex), "hex");
}

export interface Signature {
  v: number;
  r: string;
  s: string;
}

export function ecSign(digest: string, privateKey: string): Signature {
  const { v, r, s } = ecsign(
    bufferFromHexString(digest),
    bufferFromHexString(privateKey)
  );

  return { v, r: hexStringFromBuffer(r), s: hexStringFromBuffer(s) };
}

export function bytes32FromAddress(address: string): string {
  return prepend0x(strip0x(address).toLowerCase().padStart(64, "0"));
}
