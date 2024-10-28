/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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

import {
  ContractWithPublicFunctionsInstance,
  ContractWithExternalFunctionsInstance,
  ContractThatCallsPublicFunctionsInstance,
} from "../../@types/generated";
import { HARDHAT_ACCOUNTS } from "../helpers/constants";

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

describe("public to external", () => {
  describe("changing access modifier from public to external", () => {
    const from = HARDHAT_ACCOUNTS[0];

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
        { from }
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
