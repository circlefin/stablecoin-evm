/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
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

import BN from "bn.js";
import {
  AnyFiatTokenV2Instance,
  OptimismMintableFiatTokenV2_2InstanceExtended,
} from "../../@types/AnyFiatTokenV2Instance";
import {
  expectRevert,
  generateAccounts,
  initializeToVersion,
  linkLibraryToTokenContract,
} from "../helpers";
import { HARDHAT_ACCOUNTS, POW_2_255_BN } from "../helpers/constants";
import {
  STORAGE_SLOT_NUMBERS,
  addressMappingSlot,
  readSlot,
  usesOriginalStorageSlotPositions,
} from "../helpers/storageSlots.behavior";
import { behavesLikeFiatTokenV2 } from "./v2.behavior";
import {
  SignatureBytesType,
  permitSignature,
  permitSignatureV22,
  transferWithAuthorizationSignature,
  transferWithAuthorizationSignatureV22,
  cancelAuthorizationSignature,
  cancelAuthorizationSignatureV22,
  receiveWithAuthorizationSignature,
  receiveWithAuthorizationSignatureV22,
} from "./GasAbstraction/helpers";
import { encodeCall } from "../v1/helpers/tokenTest";
import { behavesLikeFiatTokenV22 } from "./v2_2.behavior";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const OptimismMintableFiatTokenV2_2 = artifacts.require(
  "OptimismMintableFiatTokenV2_2"
);

describe("OptimismMintableFiatTokenV2_2", () => {
  const newSymbol = "USDCUSDC";
  const fiatTokenOwner = HARDHAT_ACCOUNTS[9];
  const lostAndFound = HARDHAT_ACCOUNTS[2];
  const proxyOwnerAccount = HARDHAT_ACCOUNTS[14];
  const l1RemoteToken = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  let fiatToken: OptimismMintableFiatTokenV2_2InstanceExtended;

  const getFiatToken = (
    signatureBytesType: SignatureBytesType
  ): (() => AnyFiatTokenV2Instance) => {
    return () => {
      initializeOverloadedMethods(fiatToken, signatureBytesType);
      return fiatToken;
    };
  };

  before(async () => {
    await linkLibraryToTokenContract(FiatTokenV2_1);
    await linkLibraryToTokenContract(OptimismMintableFiatTokenV2_2);
  });

  beforeEach(async () => {
    fiatToken = await OptimismMintableFiatTokenV2_2.new(l1RemoteToken);
    await initializeToVersion(fiatToken, "2.1", fiatTokenOwner, lostAndFound);
  });

  describe("initializeV2_2", () => {
    it("disallows calling initializeV2_2 twice", async () => {
      await fiatToken.initializeV2_2([], newSymbol);
      await expectRevert(fiatToken.initializeV2_2([], newSymbol));
    });

    it("should update symbol", async () => {
      await fiatToken.initializeV2_2([], newSymbol);
      expect(await fiatToken.symbol()).to.eql(newSymbol);
    });

    it("should blacklist all accountsToBlacklist", async () => {
      const [unblacklistedAccount, ...accountsToBlacklist] = generateAccounts(
        10
      );

      // Prepare a proxy that's tied to a V2_1 implementation so that we can blacklist
      // the account in _deprecatedBlacklisted first.
      const _fiatTokenV2_1 = await FiatTokenV2_1.new();
      const _proxy = await FiatTokenProxy.new(_fiatTokenV2_1.address, {
        from: proxyOwnerAccount,
      });
      const _proxyAsV2_1 = await FiatTokenV2_1.at(_proxy.address);
      await initializeToVersion(
        _proxyAsV2_1,
        "2.1",
        fiatTokenOwner,
        lostAndFound
      );
      await Promise.all(
        accountsToBlacklist.map((a) =>
          _proxyAsV2_1.blacklist(a, { from: fiatTokenOwner })
        )
      );

      // Sanity check that _deprecatedBlacklisted is set, and balanceAndBlacklistStates is not set for
      // every accountsToBlacklist.
      expect(
        (
          await readDeprecatedBlacklisted(_proxy.address, accountsToBlacklist)
        ).every((result) => result === 1)
      ).to.be.true;
      expect(
        (
          await readBalanceAndBlacklistStates(
            _proxy.address,
            accountsToBlacklist
          )
        ).every((result) => result.eq(new BN(0)))
      ).to.be.true;

      // Sanity check that _deprecatedBlacklisted is set, and balanceAndBlacklistStates is not set
      // for `address(this)`
      expect(
        (await readDeprecatedBlacklisted(_proxy.address, [_proxy.address]))[0]
      ).to.equal(1);
      expect(
        (
          await readBalanceAndBlacklistStates(_proxy.address, [_proxy.address])
        )[0].eq(new BN(0))
      ).to.be.true;

      // Call the initializeV2_2 function through an upgrade call.
      const initializeData = encodeCall(
        "initializeV2_2",
        ["address[]", "string"],
        [accountsToBlacklist, newSymbol]
      );
      await _proxy.upgradeToAndCall(fiatToken.address, initializeData, {
        from: proxyOwnerAccount,
      });

      // Validate that isBlacklisted returns true for every accountsToBlacklist.
      const _proxyAsV2_2 = await OptimismMintableFiatTokenV2_2.at(
        _proxy.address
      );
      const areAccountsBlacklisted = await Promise.all(
        accountsToBlacklist.map((account) =>
          _proxyAsV2_2.isBlacklisted(account)
        )
      );
      expect(areAccountsBlacklisted.every((b: boolean) => b)).to.be.true;

      // Validate that _deprecatedBlacklisted is unset, and balanceAndBlacklistStates is set for every
      // accountsToBlacklist.
      expect(
        (
          await readDeprecatedBlacklisted(_proxy.address, accountsToBlacklist)
        ).every((result) => result === 0)
      ).to.be.true;
      expect(
        (
          await readBalanceAndBlacklistStates(
            _proxy.address,
            accountsToBlacklist
          )
        ).every((result) => result.eq(POW_2_255_BN))
      ).to.be.true;

      // Validate that _deprecatedBlacklisted is unset, and balanceAndBlacklistStates is set for
      // `address(this)`
      expect(
        (await readDeprecatedBlacklisted(_proxy.address, [_proxy.address]))[0]
      ).to.equal(0);
      expect(
        (
          await readBalanceAndBlacklistStates(_proxy.address, [_proxy.address])
        )[0].eq(POW_2_255_BN)
      ).to.be.true;

      // Sanity check that an unblacklisted account does not get blacklisted.
      expect(await _proxyAsV2_2.isBlacklisted(unblacklistedAccount)).to.be
        .false;
    });

    it("should revert if an accountToBlacklist was not blacklisted", async () => {
      const accountsToBlacklist = generateAccounts(1);
      await expectRevert(
        fiatToken.initializeV2_2(accountsToBlacklist, newSymbol),
        "FiatTokenV2_2: Blacklisting previously unblacklisted account!"
      );

      // Sanity check that the account is not blacklisted after revert.
      expect(await fiatToken.isBlacklisted(accountsToBlacklist[0])).to.be.false;
    });
  });

  describe("initialized contract", () => {
    beforeEach(async () => {
      await fiatToken.initializeV2_2([], newSymbol);
    });

    behavesLikeFiatTokenV2(2.2, getFiatToken(SignatureBytesType.Unpacked));

    behavesLikeFiatTokenV22(getFiatToken(SignatureBytesType.Packed));
    console.log("before");
    usesOriginalStorageSlotPositions({
      Contract: OptimismMintableFiatTokenV2_2,
      version: 2.2,
      constructorArgs: [l1RemoteToken],
    });
    console.log("after");
  });
});

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
  fiatToken: OptimismMintableFiatTokenV2_2InstanceExtended,
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

/**
 * Helper method to read the _deprecatedBlacklisted map.
 * @param proxyOrImplementation the address of the proxy or implementation contract.
 * @param accounts the accounts to read states for.
 * @returns the results (in order) from reading the map.
 */
async function readDeprecatedBlacklisted(
  proxyOrImplementation: string,
  accounts: string[]
): Promise<number[]> {
  return (
    await Promise.all(
      accounts.map((a) =>
        readSlot(
          proxyOrImplementation,
          addressMappingSlot(a, STORAGE_SLOT_NUMBERS._deprecatedBlacklisted)
        )
      )
    )
  ).map((result) => parseInt(result, 16));
}

/**
 * Helper method to read the balanceAndBlacklistStates map.
 * @param proxyOrImplementation the address of the proxy or implementation contract.
 * @param accounts the accounts to read states for.
 * @returns the results (in order) from reading the map.
 */
async function readBalanceAndBlacklistStates(
  proxyOrImplementation: string,
  accounts: string[]
): Promise<BN[]> {
  return (
    await Promise.all(
      accounts.map((a) =>
        readSlot(
          proxyOrImplementation,
          addressMappingSlot(a, STORAGE_SLOT_NUMBERS.balanceAndBlacklistStates)
        )
      )
    )
  ).map((result) => new BN(result.slice(2), 16));
}
