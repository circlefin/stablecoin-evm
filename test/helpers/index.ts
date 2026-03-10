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

import { ecsign } from "ethereumjs-util";
import { assert } from "chai";
import { solidityPack } from "ethereumjs-abi";
import {
  FiatTokenProxyInstance,
  FiatTokenV1_1Instance,
  FiatTokenV1Instance,
  FiatTokenV2_1Instance,
  FiatTokenV2_2Instance,
  FiatTokenV2Instance,
  FiatTokenCeloV2_2Instance,
  FiatTokenInjectiveV2_2Instance,
} from "../../@types/generated";
import _ from "lodash";
import {
  FiatTokenCeloV2_2InstanceExtended,
  FiatTokenInjectiveV2_2InstanceExtended,
  FiatTokenV2_2InstanceExtended,
} from "../../@types/AnyFiatTokenV2Instance";
import {
  cancelAuthorizationSignature,
  cancelAuthorizationSignatureV22,
  permitSignature,
  permitSignatureV22,
  receiveWithAuthorizationSignature,
  receiveWithAuthorizationSignatureV22,
  SignatureBytesType,
  transferWithAuthorizationSignature,
  transferWithAuthorizationSignatureV22,
} from "../v2/GasAbstraction/helpers";

const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const SignatureChecker = artifacts.require("SignatureChecker");

export async function expectRevert(
  promise: Promise<unknown>,
  reason?: string | RegExp
): Promise<void> {
  let err: Error | undefined;
  try {
    await promise;
  } catch (e) {
    err = e as Error;
  }

  if (!err) {
    assert.fail("Exception not thrown");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errMsg: string = (err as any).hijackedMessage ?? err.message;

  if (!reason) {
    assert.match(errMsg, /revert/i);
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

export function packSignature(signature: Signature): Buffer {
  const { v, r, s } = signature;
  return solidityPack(["bytes32", "bytes32", "uint8"], [r, s, v]);
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

export function makeDomainSeparator(
  name: string,
  version: string,
  chainId: number,
  address: string
): string {
  return web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        web3.utils.keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        web3.utils.keccak256(name),
        web3.utils.keccak256(version),
        chainId,
        address,
      ]
    )
  );
}

/**
 * Helper function to generate a number of fake accounts.
 * @param n the number of accounts to generate.
 * @returns a list of accounts.
 */
export function generateAccounts(n: number): string[] {
  return _.range(0, n).map(() => web3.eth.accounts.create().address);
}

export async function initializeToVersion(
  proxyOrImplementation:
    | FiatTokenProxyInstance
    | FiatTokenV1Instance
    | FiatTokenV1_1Instance
    | FiatTokenV2Instance
    | FiatTokenV2_1Instance
    | FiatTokenV2_2Instance
    | FiatTokenCeloV2_2Instance
    | FiatTokenInjectiveV2_2Instance,
  version: "1" | "1.1" | "2" | "2.1" | "2.2",
  fiatTokenOwner: string,
  lostAndFound: string,
  accountsToBlacklist: string[] = []
): Promise<void> {
  if (version >= "2.2") {
    const proxyAsV2_2 = await FiatTokenV2_2.at(proxyOrImplementation.address);
    await proxyAsV2_2.initialize({
      tokenName: "USDC",
      tokenSymbol: "USDCUSDC",
      tokenCurrency: "USD",
      tokenDecimals: 6,
      newMasterMinter: fiatTokenOwner,
      newPauser: fiatTokenOwner,
      newBlacklister: fiatTokenOwner,
      newOwner: fiatTokenOwner,
      accountsToBlacklist: accountsToBlacklist,
    });
    return;
  }

  const proxyAsV1 = await FiatTokenV1.at(proxyOrImplementation.address);
  await proxyAsV1.initialize(
    "USDC",
    "USDC",
    "USD",
    6,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner,
    fiatTokenOwner
  );

  if (version >= "2") {
    const proxyAsV2 = await FiatTokenV2.at(proxyOrImplementation.address);
    await proxyAsV2.initializeV2("USDC", {
      from: fiatTokenOwner,
    });
  }

  if (version >= "2.1") {
    const proxyAsV2_1 = await FiatTokenV2_1.at(proxyOrImplementation.address);
    await proxyAsV2_1.initializeV2_1(lostAndFound);
  }
}

/**
 * With v2.2 we introduce overloaded functions for `permit`,
 * `transferWithAuthorization`, `receiveWithAuthorization`,
 * and `cancelAuthorization`.
 *
 * Since function overloading isn't supported by Javascript,
 * the typechain library generates type interfaces for overloaded functions differently.
 * For instance, we can no longer access the `permit` function with
 * `fiattoken.permit`. Instead, we need to need to use the full function signature e.g.
 * `fiattoken.methods["permit(address,address,uint256,uint256,uint8,bytes32,bytes32)"]` OR
 * `fiattoken.methods["permit(address,address,uint256,uint256,bytes)"]` (v22 interface).
 *
 * To preserve type-coherence and reuse test suites written for v2 & v2.1 contracts,
 * here we re-assign the overloaded method definition to the method name shorthand.
 */
export function initializeOverloadedMethods(
  fiatToken:
    | FiatTokenV2_2InstanceExtended
    | FiatTokenCeloV2_2InstanceExtended
    | FiatTokenInjectiveV2_2InstanceExtended,
  signatureBytesType: SignatureBytesType
): void {
  if (signatureBytesType == SignatureBytesType.Unpacked) {
    fiatToken.permit = fiatToken.methods[permitSignature];
    fiatToken.transferWithAuthorization =
      fiatToken.methods[transferWithAuthorizationSignature];
    fiatToken.receiveWithAuthorization =
      fiatToken.methods[receiveWithAuthorizationSignature];
    fiatToken.cancelAuthorization =
      fiatToken.methods[cancelAuthorizationSignature];
  } else {
    fiatToken.permit = fiatToken.methods[permitSignatureV22];
    fiatToken.transferWithAuthorization =
      fiatToken.methods[transferWithAuthorizationSignatureV22];
    fiatToken.receiveWithAuthorization =
      fiatToken.methods[receiveWithAuthorizationSignatureV22];
    fiatToken.cancelAuthorization =
      fiatToken.methods[cancelAuthorizationSignatureV22];
  }
}

export async function linkLibraryToTokenContract<
  T extends Truffle.ContractInstance,
>(tokenContract: Truffle.Contract<T>): Promise<void> {
  try {
    const signatureChecker = await SignatureChecker.new();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    tokenContract.link(signatureChecker);
  } catch (e) {
    console.error(e);
    // do nothing
  }
}
