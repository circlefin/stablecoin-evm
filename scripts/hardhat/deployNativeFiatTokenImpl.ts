/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

/**
 * Deploys the NativeFiatTokenV2_2 implementation contract and its dependencies.
 * This is exported for use in another Hardhat project repository that needs to deploy the contract for e2e tests.
 */
export async function deployNativeFiatTokenV2_2Implementation(): Promise<{
  signatureChecker: string;
  fiatTokenImpl: string;
}> {
  // 1. Deploy SignatureChecker
  const SignatureChecker = artifacts.require("SignatureChecker");
  const signatureChecker = await SignatureChecker.new();

  // 2. Deploy NativeFiatTokenV2_2
  const NativeFiatTokenV2_2 = artifacts.require("NativeFiatTokenV2_2");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  NativeFiatTokenV2_2.link(signatureChecker);
  const nativeFiatTokenV2_2 = await NativeFiatTokenV2_2.new();

  // Initialize the implementation contracts with dummy values
  await nativeFiatTokenV2_2.initialize(
    "",
    "",
    "",
    0,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS
  );
  await nativeFiatTokenV2_2.initializeV2("");

  // Since initializeV2_1 calls out to the precompile to blocklist, which will fail,
  // we cannot call the subsequent initializers (and nor can anyone else).

  return {
    signatureChecker: signatureChecker.address,
    fiatTokenImpl: nativeFiatTokenV2_2.address,
  };
}
