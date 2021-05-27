import { FiatTokenV2Instance } from "../../../@types/generated";
import { TestParams } from "./helpers";
import { testTransferWithAuthorization } from "./testTransferWithAuthorization";
import { testCancelAuthorization } from "./testCancelAuthorization";
import { testPermit } from "./testPermit";
import { testTransferWithMultipleAuthorizations } from "./testTransferWithMultipleAuthorizations";
import { testReceiveWithAuthorization } from "./testReceiveWithAuthorization";

export function hasGasAbstraction(
  getFiatToken: () => FiatTokenV2Instance,
  getDomainSeparator: () => string,
  fiatTokenOwner: string,
  accounts: Truffle.Accounts
): void {
  describe("GasAbstraction", () => {
    const testParams: TestParams = {
      getFiatToken,
      getDomainSeparator,
      fiatTokenOwner,
      accounts,
    };

    describe("EIP-3009", () => {
      testTransferWithAuthorization(testParams);
      testReceiveWithAuthorization(testParams);
      testCancelAuthorization(testParams);
      testTransferWithMultipleAuthorizations(testParams);
    });

    describe("EIP-2612", () => {
      testPermit(testParams);
    });
  });
}
