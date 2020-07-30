import { FiatTokenV2Instance } from "../../../@types/generated";
import { TestParams } from "./helpers";
import { testTransferWithAuthorization } from "./testTransferWithAuthorization";
import { testApproveWithAuthorization } from "./testApproveWithAuthorization";
import { testIncreaseAllowanceWithAuthorization } from "./testIncreaseAllowanceWithAuthorization";
import { testDecreaseAllowanceWithAuthorization } from "./testDecreaseAllowanceWithAuthorization";
import { testCancelAuthorization } from "./testCancelAuthorization";
import { testPermit } from "./testPermit";
import { testTransferWithMultipleAuthorizations } from "./testTransferWithMultipleAuthorizations";

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

    testTransferWithAuthorization(testParams);
    testApproveWithAuthorization(testParams);
    testIncreaseAllowanceWithAuthorization(testParams);
    testDecreaseAllowanceWithAuthorization(testParams);
    testCancelAuthorization(testParams);
    testPermit(testParams);
    testTransferWithMultipleAuthorizations(testParams);
  });
}
