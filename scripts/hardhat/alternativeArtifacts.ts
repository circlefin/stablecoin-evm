/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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

import { ContractArtifact } from "./verifyOnChainBytecode";
import * as fs from "fs";

type AlternativeArtifact = Map<string, ContractArtifact>;

export enum ArtifactType {
  OPMainnet = "OPMainnet",
}

const CACHED_ARTIFACTS_PATH = "./cached_artifacts/";

// Read from https://optimistic.etherscan.io/token/0x0b2c639c533813f4aa9d7837caf62653d097ff85#code
export const opMainnetFiatTokenProxyContractCreationBytecode = readCachedArtifact(
  "opMainnetFiatTokenProxyContractCreationBytecode.bin"
);
const opMainnetFiatTokenProxyRuntimeBytecode = readCachedArtifact(
  "opMainnetFiatTokenProxyRuntimeBytecode.bin"
);

const opMainnetArtifacts: AlternativeArtifact = new Map([
  [
    "FiatTokenProxy",
    {
      creationBytecode: opMainnetFiatTokenProxyContractCreationBytecode,
      runtimeBytecode: opMainnetFiatTokenProxyRuntimeBytecode,
      creationLinkReferences: {},
      runtimeLinkReferences: {},
    },
  ],
]);

export const alternativeArtifacts: Map<
  ArtifactType,
  AlternativeArtifact
> = new Map([[ArtifactType.OPMainnet, opMainnetArtifacts]]);

function readCachedArtifact(filename: string): string {
  return (
    "0x" + fs.readFileSync(CACHED_ARTIFACTS_PATH + filename, "utf-8").trim()
  );
}
