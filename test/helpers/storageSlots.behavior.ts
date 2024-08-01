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
import { FiatTokenProxyInstance } from "../../@types/generated";
import { HARDHAT_ACCOUNTS, POW_2_255_BN, ZERO_BYTES32 } from "./constants";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV1_1 = artifacts.require("FiatTokenV1_1");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const OptimismMintableFiatTokenV2_2 = artifacts.require(
  "OptimismMintableFiatTokenV2_2"
);

export const STORAGE_SLOT_NUMBERS = {
  _deprecatedBlacklisted: 3,
  balanceAndBlacklistStates: 9,
};

export function usesOriginalStorageSlotPositions<
  T extends Truffle.ContractInstance
>({
  Contract,
  version,
  constructorArgs,
}: {
  Contract: Truffle.Contract<T>;
  version: 1 | 1.1 | 2 | 2.1 | 2.2;
  constructorArgs?: unknown[];
}): void {
  describe("uses original storage slot positions", () => {
    const [name, symbol, currency, decimals] = ["USD Coin", "USDC", "USD", 6];
    const [mintAllowance, minted, transferred, allowance] = [
      1000e6,
      100e6,
      30e6,
      10e6,
    ];
    const [mintedBN, transferredBN] = [minted, transferred].map(
      (v) => new BN(v, 10)
    );
    const [
      owner,
      proxyAdmin,
      masterMinter,
      pauser,
      blacklister,
      minter,
      rescuer,
      alice,
      bob,
      charlie,
      lostAndFound,
    ] = HARDHAT_ACCOUNTS;

    let fiatToken: T;
    let proxy: FiatTokenProxyInstance;
    let domainSeparator: string;

    beforeEach(async () => {
      fiatToken = await Contract.new(...(constructorArgs || []));
      proxy = await FiatTokenProxy.new(fiatToken.address);
      await proxy.changeAdmin(proxyAdmin);

      const proxyAsFiatTokenV1 = await FiatTokenV1.at(proxy.address);
      await proxyAsFiatTokenV1.initialize(
        name,
        symbol,
        currency,
        decimals,
        masterMinter,
        pauser,
        blacklister,
        owner
      );

      await proxyAsFiatTokenV1.configureMinter(minter, mintAllowance, {
        from: masterMinter,
      });
      await proxyAsFiatTokenV1.mint(alice, minted, { from: minter });
      await proxyAsFiatTokenV1.transfer(bob, transferred, { from: alice });
      await proxyAsFiatTokenV1.approve(charlie, allowance, { from: alice });
      await proxyAsFiatTokenV1.blacklist(bob, { from: blacklister });
      await proxyAsFiatTokenV1.blacklist(charlie, { from: blacklister });
      await proxyAsFiatTokenV1.pause({ from: pauser });

      if (version >= 1.1) {
        const proxyAsFiatTokenV1_1 = await FiatTokenV1_1.at(proxy.address);
        await proxyAsFiatTokenV1_1.updateRescuer(rescuer, {
          from: owner,
        });
      }
      if (version >= 2) {
        const proxyAsFiatTokenV2 = await FiatTokenV2.at(proxy.address);
        await proxyAsFiatTokenV2.initializeV2(name);
        domainSeparator = await proxyAsFiatTokenV2.DOMAIN_SEPARATOR();
      }
      if (version >= 2.1) {
        const proxyAsFiatTokenV2_1 = await FiatTokenV2_1.at(proxy.address);
        await proxyAsFiatTokenV2_1.initializeV2_1(lostAndFound);
      }
      if (version >= 2.2) {
        const proxyAsFiatTokenV2_2 = constructorArgs
          ? await OptimismMintableFiatTokenV2_2.at(proxy.address)
          : await FiatTokenV2_2.at(proxy.address);
        await proxyAsFiatTokenV2_2.initializeV2_2([], symbol);
      }
    });

    it("retains original storage slots 0 through 13", async () => {
      const slots = new Array<string>(14);
      for (let i = 0; i < slots.length; i++) {
        slots[i] = await readSlot(proxy.address, i);
      }

      // slot 0 - owner
      checkSlot(slots[0], [{ type: "address", value: owner }]); // owner

      // slot 1 - pauser, paused
      // values are lower-order aligned
      checkSlot(slots[1], [
        { type: "bool", value: true },
        { type: "address", value: pauser },
      ]); // paused + pauser

      // slot 2 - blacklister
      checkSlot(slots[2], [{ type: "address", value: blacklister }]); // blacklister

      // slot 3 - _deprecatedBlacklisted (mapping, slot is unused)
      checkSlot(slots[3], ZERO_BYTES32);

      // slot 4 - name
      checkSlot(slots[4], [{ type: "string", value: name }]);

      // slot 5 - symbol
      checkSlot(slots[5], [{ type: "string", value: symbol }]);

      // slot 6 - decimals
      checkSlot(slots[6], [{ type: "uint8", value: decimals }]);

      // slot 7 - currency
      checkSlot(slots[7], [{ type: "string", value: currency }]);

      // slot 8 - masterMinter, initialized
      checkSlot(slots[8], [
        { type: "bool", value: true },
        { type: "address", value: masterMinter },
      ]); // initialized + masterMinter

      // slot 9 - balanceAndBlacklistStates (mapping, slot is unused)
      checkSlot(slots[9], ZERO_BYTES32);

      // slot 10 - allowed (mapping, slot is unused)
      checkSlot(slots[10], ZERO_BYTES32);

      // slot 11 - totalSupply
      checkSlot(slots[11], [{ type: "uint256", value: minted }]);

      // slot 12 - minters (mapping, slot is unused)
      checkSlot(slots[12], ZERO_BYTES32);

      // slot 13 - minterAllowed (mapping, slot is unused)
      checkSlot(slots[13], ZERO_BYTES32);
    });

    if (version >= 1.1) {
      it("retains slot 14 for rescuer", async () => {
        const slot = await readSlot(proxy.address, 14);
        checkSlot(slot, [{ type: "address", value: rescuer }]);
      });
    }

    if (version >= 2) {
      it("retains slot 15 for DOMAIN_SEPARATOR", async () => {
        const slot = await readSlot(proxy.address, 15);

        // Cached domain separator is deprecated in v2.2. But we still need to ensure the storage slot is retained.
        checkSlot(slot, domainSeparator);
      });
    }

    it("retains original storage slots for _deprecatedBlacklisted mapping", async () => {
      // _deprecatedBlacklisted[alice]
      let slot = await readSlot(
        proxy.address,
        addressMappingSlot(alice, STORAGE_SLOT_NUMBERS._deprecatedBlacklisted)
      );
      checkSlot(slot, [{ type: "bool", value: false }]);

      // _deprecatedBlacklisted[bob] - this should be set to true in pre-v2.2 versions,
      // and left untouched in v2.2+ versions.
      slot = await readSlot(
        proxy.address,
        addressMappingSlot(bob, STORAGE_SLOT_NUMBERS._deprecatedBlacklisted)
      );
      if (version >= 2.2) {
        checkSlot(slot, [{ type: "bool", value: false }]);
      } else {
        checkSlot(slot, [{ type: "bool", value: true }]);
      }

      // _deprecatedBlacklisted[charlie] - this should be set to true in pre-v2.2 versions,
      // and left untouched in v2.2+ versions.
      slot = await readSlot(
        proxy.address,
        addressMappingSlot(charlie, STORAGE_SLOT_NUMBERS._deprecatedBlacklisted)
      );
      if (version >= 2.2) {
        checkSlot(slot, [{ type: "bool", value: false }]);
      } else {
        checkSlot(slot, [{ type: "bool", value: true }]);
      }
    });

    it("retains original storage slots for balanceAndBlacklistStates mapping", async () => {
      // balanceAndBlacklistStates[alice] - not blacklisted, has balance
      let slot = await readSlot(
        proxy.address,
        addressMappingSlot(
          alice,
          STORAGE_SLOT_NUMBERS.balanceAndBlacklistStates
        )
      );
      let expectedValue = mintedBN.sub(transferredBN);
      checkSlot(slot, [{ type: "uint256", value: expectedValue }]);

      // balanceAndBlacklistStates[bob] - blacklisted, has balance
      slot = await readSlot(
        proxy.address,
        addressMappingSlot(bob, STORAGE_SLOT_NUMBERS.balanceAndBlacklistStates)
      );
      expectedValue =
        version >= 2.2 ? POW_2_255_BN.add(transferredBN) : transferredBN;
      checkSlot(slot, [{ type: "uint256", value: expectedValue }]);

      // balanceAndBlacklistStates[charlie] - blacklisted, no balance
      slot = await readSlot(
        proxy.address,
        addressMappingSlot(
          charlie,
          STORAGE_SLOT_NUMBERS.balanceAndBlacklistStates
        )
      );
      expectedValue = version >= 2.2 ? POW_2_255_BN : new BN(0);
      checkSlot(slot, [{ type: "uint256", value: expectedValue }]);
    });

    it("retains original storage slots for allowed mapping", async () => {
      // allowed[alice][bob]
      let slot = await readSlot(
        proxy.address,
        address2MappingSlot(alice, bob, 10)
      );
      checkSlot(slot, [{ type: "uint256", value: 0 }]);

      // allowed[alice][charlie]
      slot = await readSlot(
        proxy.address,
        address2MappingSlot(alice, charlie, 10)
      );
      checkSlot(slot, [{ type: "uint256", value: allowance }]);
    });

    it("retains original storage slots for minters mapping", async () => {
      // minters[minter]
      let slot = await readSlot(proxy.address, addressMappingSlot(minter, 12));
      checkSlot(slot, [{ type: "bool", value: true }]);

      // minters[alice]
      slot = await readSlot(proxy.address, addressMappingSlot(alice, 12));
      checkSlot(slot, [{ type: "bool", value: false }]);
    });

    it("retains original storage slots for minterAllowed mapping", async () => {
      // minterAllowed[minter]
      let slot = await readSlot(proxy.address, addressMappingSlot(minter, 13));
      checkSlot(slot, [{ type: "uint256", value: mintAllowance - minted }]);

      // minterAllowed[alice]
      slot = await readSlot(proxy.address, addressMappingSlot(alice, 13));
      checkSlot(slot, [{ type: "uint256", value: 0 }]);
    });
  });
}

export async function readSlot(
  address: string,
  slot: number | string
): Promise<string> {
  const data = await web3.eth.getStorageAt(
    address,
    slot as number // does support string, but type definition file is wrong
  );
  return data;
}

function checkSlot(
  slot: string,
  expectations:
    | { type: string; value: number | string | BN | boolean }[]
    | string
) {
  if (typeof expectations === "string") {
    expect(slot).to.equal(expectations);
  } else {
    const mappedExpectations = expectations.map((e) => {
      if (e.type === "bool") {
        return {
          type: e.type,
          value: e.value ? "true" : "",
        };
      }
      return e;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    const encodePacked = web3.utils.encodePacked(...mappedExpectations);
    if (!encodePacked) {
      throw new Error("Error found while encoding!");
    }

    let expectedSlotValue: string;

    // Logic to validate slots containing a string or a byte.
    // See: https://docs.soliditylang.org/en/v0.6.12/internals/layout_in_storage.html for
    // the encoding logic.
    if (
      mappedExpectations.length === 1 &&
      ["bytes", "string"].includes(mappedExpectations[0].type) &&
      mappedExpectations[0].value.length < 32
    ) {
      const lastByte = (mappedExpectations[0].value.length * 2)
        .toString(16)
        .padStart(2, "0");
      expectedSlotValue = `0x${encodePacked
        .slice(2)
        .padEnd(62, "0")}${lastByte}`;
    } else {
      expectedSlotValue = `0x${encodePacked.slice(2).padStart(64, "0")}`;
    }
    expect(slot).to.equal(expectedSlotValue);
  }
}

function encodeUint(value: number | BN): string {
  return new BN(value).toString(16).padStart(64, "0");
}

function encodeAddress(addr: string): string {
  return addr.replace(/^0x/, "").toLowerCase().padStart(64, "0");
}

export function addressMappingSlot(addr: string, pos: number): string {
  return web3.utils.keccak256("0x" + encodeAddress(addr) + encodeUint(pos));
}

function address2MappingSlot(addr: string, addr2: string, pos: number): string {
  return web3.utils.keccak256(
    "0x" + encodeAddress(addr2) + addressMappingSlot(addr, pos).slice(2)
  );
}
