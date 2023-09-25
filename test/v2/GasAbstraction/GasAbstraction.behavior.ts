import { TestParams } from "./helpers";
import { testTransferWithAuthorization } from "./testTransferWithAuthorization";
import { testCancelAuthorization } from "./testCancelAuthorization";
import { testPermit } from "./testPermit";
import { testReceiveWithAuthorization } from "./testReceiveWithAuthorization";

export function hasGasAbstraction(testParams: TestParams): void {
  describe("GasAbstraction", () => {
    describe("EIP-3009", () => {
      testTransferWithAuthorization(testParams);
      testReceiveWithAuthorization(testParams);
      testCancelAuthorization(testParams);
    });

    describe("EIP-2612", () => {
      testPermit(testParams);
    });
  });
}
