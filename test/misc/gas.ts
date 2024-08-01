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

import {
  AnyFiatTokenV2Instance,
  FiatTokenV2_2InstanceExtended,
} from "../../@types/AnyFiatTokenV2Instance";
import {
  FiatTokenV2_1Contract,
  FiatTokenV2_2Contract,
} from "../../@types/generated";
import { AllEvents } from "../../@types/generated/FiatTokenV2";
import { initializeToVersion, linkLibraryToTokenContract } from "../helpers";
import {
  HARDHAT_ACCOUNTS,
  HARDHAT_PRIVATE_KEYS,
  MAX_UINT256_HEX,
} from "../helpers/constants";
import {
  SignatureBytesType,
  permitSignature,
  permitSignatureV22,
  prepareSignature,
  signPermit,
} from "../v2/GasAbstraction/helpers";
import { getERC1271Wallet } from "../v2/v2.behavior";

const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

type TestVersion = "2.1" | "2.2";
// can be changed in case of upgrade
const TARGET_VERSION = "2.2";
type TestContract = FiatTokenV2_1Contract | FiatTokenV2_2Contract;

const versionToContract = new Map<TestVersion, TestContract>([
  ["2.1", FiatTokenV2_1],
  ["2.2", FiatTokenV2_2],
]);
const consoleMessage = "gas used for the test below:";

describe(`gas costs for version ${TARGET_VERSION}`, () => {
  const lostAndFound = HARDHAT_ACCOUNTS[2];
  const alice = HARDHAT_ACCOUNTS[3];
  const aliceKey = HARDHAT_PRIVATE_KEYS[3];
  const bob = HARDHAT_ACCOUNTS[4];
  const charlie = HARDHAT_ACCOUNTS[5];
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];
  const entireBalance = 100;
  const partialBalance = 1;
  const mintAuthorizationAmount = 10000;

  let fiatToken: AnyFiatTokenV2Instance;
  let domainSeparator: string;
  let contractTarget: TestContract;

  async function mintBalance(
    account: string
  ): Promise<Truffle.TransactionResponse<AllEvents>> {
    return fiatToken.mint(account, entireBalance, { from: fiatTokenOwner });
  }

  before(async () => {
    if (!versionToContract.get(TARGET_VERSION))
      throw new Error("invalid version");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    contractTarget = versionToContract.get(TARGET_VERSION)!;

    // NOTE: need to add a new version here if there is an upgrade
    // beyond 2.2
    await linkLibraryToTokenContract(FiatTokenV2_1);
    await linkLibraryToTokenContract(FiatTokenV2_2);
  });

  beforeEach(async () => {
    fiatToken = await contractTarget.new();
    await initializeToVersion(
      fiatToken,
      TARGET_VERSION,
      fiatTokenOwner,
      lostAndFound
    );
    await fiatToken.configureMinter(fiatTokenOwner, mintAuthorizationAmount, {
      from: fiatTokenOwner,
    });

    // mint to fiat token owner to initialize total supply
    await mintBalance(fiatTokenOwner);

    domainSeparator = await fiatToken.DOMAIN_SEPARATOR();
  });

  it("mint() where the receiver has no balance", async () => {
    const tx = await mintBalance(bob);

    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("mint() where the receiver has an existing balance", async () => {
    await mintBalance(bob);

    const tx = await mintBalance(bob);
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("burn() entire balance", async () => {
    if ("burn" in fiatToken) {
      const tx = await fiatToken.burn(entireBalance, { from: fiatTokenOwner });
      console.log(consoleMessage, tx.receipt.gasUsed);
    }
  });

  it("burn() partial balance", async () => {
    if ("burn" in fiatToken) {
      const tx = await fiatToken.burn(partialBalance, { from: fiatTokenOwner });
      console.log(consoleMessage, tx.receipt.gasUsed);
    }
  });

  it("transfer() where both parties have a balance before and after", async () => {
    await mintBalance(alice);
    await mintBalance(bob);

    const tx = await fiatToken.transfer(bob, partialBalance, {
      from: alice,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("transfer() where sender transfers their entire balance, receiver has a balance", async () => {
    await mintBalance(alice);
    await mintBalance(bob);

    const tx = await fiatToken.transfer(bob, entireBalance, {
      from: alice,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("transfer() where sender transfers their entire balance, receiver has no balance", async () => {
    await mintBalance(bob);

    const tx = await fiatToken.transfer(alice, entireBalance, {
      from: bob,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("transfer() where sender transfers part of their balance, receiver has no balance", async () => {
    await mintBalance(alice);

    const tx = await fiatToken.transfer(bob, partialBalance, {
      from: alice,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("transferFrom() where both parties have a balance before and after", async () => {
    await mintBalance(alice);
    await mintBalance(bob);

    await fiatToken.approve(bob, entireBalance, { from: alice });

    const tx = await fiatToken.transferFrom(alice, bob, partialBalance, {
      from: bob,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("transferFrom() where sender transfers their entire balance, receiver has a balance", async () => {
    await mintBalance(alice);
    await mintBalance(bob);

    await fiatToken.approve(bob, entireBalance, { from: alice });

    const tx = await fiatToken.transferFrom(alice, bob, entireBalance, {
      from: bob,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("transferFrom() where sender transfers their entire balance, receiver has no balance", async () => {
    await mintBalance(alice);

    await fiatToken.approve(bob, entireBalance, { from: alice });

    const tx = await fiatToken.transferFrom(alice, bob, entireBalance, {
      from: bob,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("transferFrom() where sender transfers part of their balance, receiver has no balance", async () => {
    await mintBalance(alice);

    await fiatToken.approve(bob, entireBalance, { from: alice });

    const tx = await fiatToken.transferFrom(alice, bob, partialBalance, {
      from: bob,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("approve()", async () => {
    const tx = await fiatToken.approve(bob, entireBalance, { from: alice });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("increaseAllowance() with no prior approval", async () => {
    const tx = await fiatToken.increaseAllowance(bob, entireBalance, {
      from: alice,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("increaseAllowance() on existing approval", async () => {
    await fiatToken.approve(bob, entireBalance, { from: alice });

    const tx = await fiatToken.increaseAllowance(bob, entireBalance, {
      from: alice,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("decreaseAllowance() to zero", async () => {
    await fiatToken.approve(bob, entireBalance, { from: alice });

    const tx = await fiatToken.decreaseAllowance(bob, entireBalance, {
      from: alice,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("decreaseAllowance() to non-zero", async () => {
    await fiatToken.approve(bob, entireBalance, { from: alice });

    const tx = await fiatToken.decreaseAllowance(bob, partialBalance, {
      from: alice,
    });
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("permit() with an EOA", async () => {
    const nonce = 0;
    const deadline = MAX_UINT256_HEX;
    const signatureType = SignatureBytesType.Unpacked;

    // permit() is overloaded as of 2.2, so we need to specify which permit()
    // version to hit. In this case, the EOA version.
    if (Number(TARGET_VERSION) >= 2.2) {
      (fiatToken as FiatTokenV2_2InstanceExtended).permit = (fiatToken as FiatTokenV2_2InstanceExtended).methods[
        permitSignature
      ];
    }

    const signature = signPermit(
      alice,
      bob,
      entireBalance,
      nonce,
      deadline,
      domainSeparator,
      aliceKey
    );
    const tx = await fiatToken.permit(
      alice,
      bob,
      entireBalance,
      deadline,
      ...prepareSignature(signature, signatureType),
      { from: charlie }
    );
    console.log(consoleMessage, tx.receipt.gasUsed);
  });

  it("permit() with an EIP-1271 wallet", async () => {
    const nonce = 0;
    const deadline = MAX_UINT256_HEX;
    const signatureType = SignatureBytesType.Packed;
    const aliceWallet = await getERC1271Wallet(alice);

    if (Number(TARGET_VERSION) < 2.2) {
      console.log("Test below not relevant for this contract version");
      return;
    }

    // permit() is overloaded as of 2.2, so we need to specify which permit()
    // version to hit. In this case, the EIP-1271 version.
    {
      (fiatToken as FiatTokenV2_2InstanceExtended).permit = (fiatToken as FiatTokenV2_2InstanceExtended).methods[
        permitSignatureV22
      ];
    }

    const signature = signPermit(
      aliceWallet.address,
      bob,
      entireBalance,
      nonce,
      deadline,
      domainSeparator,
      aliceKey
    );
    const tx = await fiatToken.permit(
      aliceWallet.address,
      bob,
      entireBalance,
      deadline,
      ...prepareSignature(signature, signatureType),
      { from: charlie }
    );
    console.log(consoleMessage, tx.receipt.gasUsed);
  });
});
