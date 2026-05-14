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

import hre from "hardhat";
import { NativeFiatTokenV2_2InstanceExtended } from "../../../@types/AnyFiatTokenV2Instance";
import { deployNativeFiatTokenV2_2Implementation } from "../../../scripts/hardhat/deployNativeFiatTokenImpl";
import {
  MOCK_NATIVE_COIN_AUTHORITY_ADDRESS,
  MOCK_NATIVE_COIN_CONTROL_ADDRESS,
} from "../../helpers/nativeFiatTokenAddresses";

describe("Deploy Native FiatToken Implementation", () => {
  let fiatTokenImplementation: NativeFiatTokenV2_2InstanceExtended;

  const NATIVE_COIN_AUTHORITY = MOCK_NATIVE_COIN_AUTHORITY_ADDRESS;
  const NATIVE_COIN_CONTROL = MOCK_NATIVE_COIN_CONTROL_ADDRESS;
  const DUMMY_ADDRESS = "0x0000000000000000000000000000000000000001";

  before("setup", async () => {
    const NativeFiatTokenV2_2 = artifacts.require("NativeFiatTokenV2_2");
    const {
      fiatTokenImpl: implAddr,
    } = await deployNativeFiatTokenV2_2Implementation();

    fiatTokenImplementation = (await NativeFiatTokenV2_2.at(
      implAddr
    )) as NativeFiatTokenV2_2InstanceExtended;
  });

  it("initializes the implementation with dummy values", async () => {
    expect(await fiatTokenImplementation.name()).to.equal("");
    expect(await fiatTokenImplementation.symbol()).to.equal("");
    expect(await fiatTokenImplementation.currency()).to.equal("");
    expect(await fiatTokenImplementation.decimals()).to.equal(0);
    expect(await fiatTokenImplementation.masterMinter()).to.equal(
      DUMMY_ADDRESS
    );
    expect(await fiatTokenImplementation.pauser()).to.equal(DUMMY_ADDRESS);
    expect(await fiatTokenImplementation.blacklister()).to.equal(DUMMY_ADDRESS);
    expect(await fiatTokenImplementation.owner()).to.equal(DUMMY_ADDRESS);
    expect(await fiatTokenImplementation.rescuer()).to.equal(
      hre.ethers.ZeroAddress
    );
  });

  it("initializes the implementation with correct precompile addresses and scaling factor", async () => {
    expect(await fiatTokenImplementation.NATIVE_COIN_AUTHORITY()).to.equal(
      NATIVE_COIN_AUTHORITY
    );
    expect(await fiatTokenImplementation.NATIVE_COIN_CONTROL()).to.equal(
      NATIVE_COIN_CONTROL
    );
    expect(await fiatTokenImplementation.DECIMALS_SCALING_FACTOR()).to.equal(
      10 ** 12
    );
  });
});
