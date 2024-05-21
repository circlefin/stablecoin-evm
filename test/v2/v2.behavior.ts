/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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

import { behavesLikeRescuable } from "../v1.1/Rescuable.behavior";
import {
  MockERC1271WalletInstance,
  RescuableInstance,
} from "../../@types/generated";
import { AnyFiatTokenV2Instance } from "../../@types/AnyFiatTokenV2Instance";
import { hasSafeAllowance } from "./safeAllowance.behavior";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import {
  SignatureBytesType,
  TestParams,
  WalletType,
  makeDomainSeparator,
} from "./GasAbstraction/helpers";
import { expectRevert } from "../helpers";
import { testTransferWithMultipleAuthorizations } from "./GasAbstraction/testTransferWithMultipleAuthorizations";

const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");

export function behavesLikeFiatTokenV2(
  version: number,
  getFiatToken: () => AnyFiatTokenV2Instance
): void {
  let domainSeparator: string;
  let fiatTokenOwner: string;

  beforeEach(async () => {
    // owner() is run here instead of once in a before() hook, since the contract
    // must be instantiated by a previously defined beforeEach() hook before
    // calling owner()
    fiatTokenOwner = await getFiatToken().owner();

    domainSeparator = makeDomainSeparator(
      "USDC",
      "2",
      await web3.eth.getChainId(),
      getFiatToken().address
    );
  });

  behavesLikeRescuable(getFiatToken as () => RescuableInstance);

  it("has the expected domain separator", async () => {
    expect(await getFiatToken().DOMAIN_SEPARATOR()).to.equal(domainSeparator);
  });

  hasSafeAllowance(version, getFiatToken);

  const testParams: TestParams = {
    version,
    getFiatToken,
    getDomainSeparator: () => domainSeparator,
    getERC1271Wallet,
    signerWalletType: WalletType.EOA,
    signatureBytesType: SignatureBytesType.Unpacked,
  };

  hasGasAbstraction(testParams);

  testTransferWithMultipleAuthorizations(testParams);

  it("disallows calling initializeV2 twice", async () => {
    // It was called once in beforeEach. Try to call again.
    await expectRevert(
      getFiatToken().initializeV2("Not USDC", { from: fiatTokenOwner })
    );
  });
}

export async function getERC1271Wallet(
  owner: string
): Promise<MockERC1271WalletInstance> {
  return await MockERC1271Wallet.new(owner);
}
