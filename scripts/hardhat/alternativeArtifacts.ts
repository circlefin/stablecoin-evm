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
  ArbMainnet = "ArbMainnet",
  BaseMainnet = "BaseMainnet"
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

// Read from https://arbiscan.io/token/0xaf88d065e77c8cC2239327C5EDb3A432268e5831#code
export const arbMainnetFiatTokenProxyContractCreationBytecode = readCachedArtifact(
  "arbMainnetFiatTokenProxyContractCreationBytecode.bin"
);
const arbMainnetFiatTokenProxyRuntimeBytecode = readCachedArtifact(
  "arbMainnetFiatTokenProxyRuntimeBytecode.bin"
);

const arbMainnetArtifacts: AlternativeArtifact = new Map([
  [
    "FiatTokenProxy",
    {
      creationBytecode: arbMainnetFiatTokenProxyContractCreationBytecode,
      runtimeBytecode: arbMainnetFiatTokenProxyRuntimeBytecode,
      creationLinkReferences: {},
      runtimeLinkReferences: {},
    },
  ],
]);

// Read from https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913#code
export const baseMainnetFiatTokenProxyContractCreationBytecode = readCachedArtifact(
  "baseMainnetFiatTokenProxyContractCreationBytecode.bin"
);
const baseMainnetFiatTokenProxyRuntimeBytecode = readCachedArtifact(
  "baseMainnetFiatTokenProxyRuntimeBytecode.bin"
);

const baseMainnetArtifacts: AlternativeArtifact = new Map([
  [
    "FiatTokenProxy",
    {
      creationBytecode: baseMainnetFiatTokenProxyContractCreationBytecode,
      runtimeBytecode: baseMainnetFiatTokenProxyRuntimeBytecode,
      creationLinkReferences: {},
      runtimeLinkReferences: {},
    },
  ],
]);

export const alternativeArtifacts: Map<
  ArtifactType,
  AlternativeArtifact
> = new Map([
  [ArtifactType.OPMainnet, opMainnetArtifacts],
  [ArtifactType.ArbMainnet, arbMainnetArtifacts],
  [ArtifactType.BaseMainnet, baseMainnetArtifacts],
]);

function readCachedArtifact(filename: string): string {
  return (
    "0x" + fs.readFileSync(CACHED_ARTIFACTS_PATH + filename, "utf-8").trim()
  );
}
