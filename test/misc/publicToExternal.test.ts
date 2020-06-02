import {
  ContractWithPublicFunctionsInstance,
  ContractWithExternalFunctionsInstance,
  ContractThatCallsPublicFunctionsInstance,
} from "../../@types/generated";

const ContractWithPublicFunctions = artifacts.require(
  "ContractWithPublicFunctions"
);
const ContractWithExternalFunctions = artifacts.require(
  "ContractWithExternalFunctions"
);
const ContractThatCallsPublicFunctions = artifacts.require(
  "ContractThatCallsPublicFunctions"
);
const FiatTokenProxy = artifacts.require("FiatTokenProxy");

contract("public to external", (accounts) => {
  describe("changing access modifier from public to external", () => {
    let contractWithPublicFunctions: ContractWithPublicFunctionsInstance;
    let contractWithExternalFunctions: ContractWithExternalFunctionsInstance;
    let contractThatCallsPublicFunctions: ContractThatCallsPublicFunctionsInstance;

    beforeEach(async () => {
      contractWithPublicFunctions = await ContractWithPublicFunctions.new();
      contractWithExternalFunctions = await ContractWithExternalFunctions.new();
      contractThatCallsPublicFunctions = await ContractThatCallsPublicFunctions.new();
    });

    it("does not affect existing contracts' ability to call", async () => {
      await contractThatCallsPublicFunctions.callSetFoo(
        contractWithPublicFunctions.address,
        "such amaze"
      );

      expect(
        await contractThatCallsPublicFunctions.callGetFoo(
          contractWithPublicFunctions.address
        )
      ).to.equal("such amaze");

      // provide the address of the contract that has external functions instead
      // even though it originally expects public functions
      await contractThatCallsPublicFunctions.callSetFoo(
        contractWithExternalFunctions.address,
        "much wow"
      );

      expect(
        await contractThatCallsPublicFunctions.callGetFoo(
          contractWithExternalFunctions.address
        )
      ).to.equal("much wow");
    });

    it("does not affect existing contracts' ability to call via a proxy", async () => {
      // deploy a proxy contract and have it pointed at the contract with public
      // functions
      const proxy = await FiatTokenProxy.new(
        contractWithPublicFunctions.address,
        { from: accounts[0] }
      );

      // verify that calling public functions via the proxy works fine
      await contractThatCallsPublicFunctions.callSetFoo(
        proxy.address,
        "such amaze"
      );

      expect(
        await contractThatCallsPublicFunctions.callGetFoo(proxy.address)
      ).to.equal("such amaze");

      // change the implementation contract to the contract with external
      // functions
      await proxy.upgradeTo(contractWithExternalFunctions.address);

      expect(await proxy.implementation()).to.equal(
        contractWithExternalFunctions.address
      );

      // verify that the existing state is preserved
      expect(
        await contractThatCallsPublicFunctions.callGetFoo(proxy.address)
      ).to.equal("such amaze");

      // and that everything still works
      await contractThatCallsPublicFunctions.callSetFoo(
        proxy.address,
        "much wow"
      );

      expect(
        await contractThatCallsPublicFunctions.callGetFoo(proxy.address)
      ).to.equal("much wow");
    });
  });
});
