import BN from "bn.js";
import crypto from "crypto";
import {
  AnyFiatTokenV2Instance,
  FiatTokenV22InstanceExtended,
} from "../../@types/AnyFiatTokenV2Instance";
import {
  expectRevert,
  generateAccounts,
  hexStringFromBuffer,
  initializeToVersion,
} from "../helpers";
import {
  ACCOUNTS_AND_KEYS,
  MAX_UINT256_HEX,
  POW_2_255_BN,
} from "../helpers/constants";
import {
  STORAGE_SLOT_NUMBERS,
  addressMappingSlot,
  parseUint,
  readSlot,
  usesOriginalStorageSlotPositions,
} from "../helpers/storageSlots.behavior";
import { behavesLikeFiatTokenV2, getERC1271Wallet } from "./FiatTokenV2.test";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import {
  SignatureBytesType,
  WalletType,
  makeDomainSeparator,
  permitSignature,
  permitSignatureV22,
  prepareSignature,
  transferWithAuthorizationSignature,
  transferWithAuthorizationSignatureV22,
  cancelAuthorizationSignature,
  cancelAuthorizationSignatureV22,
  receiveWithAuthorizationSignature,
  receiveWithAuthorizationSignatureV22,
  signTransferAuthorization,
  signReceiveAuthorization,
} from "./GasAbstraction/helpers";
import { encodeCall } from "../v1/helpers/tokenTest";

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");

contract("FiatTokenV2_2", (accounts) => {
  const fiatTokenOwner = accounts[9];
  const lostAndFound = accounts[2];
  const proxyOwnerAccount = accounts[14];
  const newSymbol = "USDCUSDC";

  let fiatToken: FiatTokenV22InstanceExtended;

  const getFiatToken = (
    signatureBytesType: SignatureBytesType
  ): (() => AnyFiatTokenV2Instance) => {
    return () => {
      initializeOverloadedMethods(fiatToken, signatureBytesType);
      return fiatToken;
    };
  };

  beforeEach(async () => {
    fiatToken = await FiatTokenV2_2.new();
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
      const _proxyAsV2_2 = await FiatTokenV2_2.at(_proxy.address);
      const areAccountsBlacklisted = await Promise.all(
        accountsToBlacklist.map((account) =>
          _proxyAsV2_2.isBlacklisted(account)
        )
      );
      expect(areAccountsBlacklisted.every((b) => b)).to.be.true;

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

    behavesLikeFiatTokenV2(
      accounts,
      2.2,
      getFiatToken(SignatureBytesType.Unpacked),
      fiatTokenOwner
    );

    behavesLikeFiatTokenV22(
      accounts,
      getFiatToken(SignatureBytesType.Packed),
      fiatTokenOwner
    );
    usesOriginalStorageSlotPositions({
      Contract: FiatTokenV2_2,
      version: 2.2,
      accounts,
    });
  });
});

export function behavesLikeFiatTokenV22(
  accounts: Truffle.Accounts,
  getFiatToken: () => AnyFiatTokenV2Instance,
  fiatTokenOwner: string
): void {
  const [minter, arbitraryAccount] = accounts.slice(3);
  let domainSeparator: string;
  let fiatToken: FiatTokenV22InstanceExtended;

  beforeEach(async () => {
    fiatToken = getFiatToken() as FiatTokenV22InstanceExtended;
    domainSeparator = makeDomainSeparator(
      "USD Coin",
      "2",
      1, // hardcoded to 1 because of ganache bug: https://github.com/trufflesuite/ganache/issues/1643
      fiatToken.address
    );
  });

  const v22TestParams = {
    version: 2.2,
    getFiatToken,
    getDomainSeparator: () => domainSeparator,
    getERC1271Wallet,
    fiatTokenOwner,
    accounts,
  };

  // Test gas abstraction functionalities with both EOA and AA wallets
  hasGasAbstraction({
    ...v22TestParams,
    signerWalletType: WalletType.EOA,
    signatureBytesType: SignatureBytesType.Packed,
  });
  hasGasAbstraction({
    ...v22TestParams,
    signerWalletType: WalletType.AA,
    signatureBytesType: SignatureBytesType.Packed,
  });

  // Additional negative test cases.
  describe("will trigger exceeded 2^255 balance error", () => {
    const incrementAmount = 1000;
    const recipient = arbitraryAccount;
    const errorMessage = "FiatTokenV2_2: Balance exceeds (2^255 - 1)";

    beforeEach(async () => {
      const recipientInitialBalance = POW_2_255_BN.sub(new BN(incrementAmount));
      await fiatToken.configureMinter(minter, POW_2_255_BN, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(recipient, recipientInitialBalance, {
        from: minter,
      });
      expect((await fiatToken.balanceOf(recipient)).eq(recipientInitialBalance))
        .to.be.true;
    });

    it("should fail to mint to recipient if balance will exceed 2^255", async () => {
      await expectRevert(
        fiatToken.mint(recipient, incrementAmount, { from: minter }),
        errorMessage
      );
    });

    it("should fail to transfer to recipient if balance will exceed 2^255", async () => {
      await fiatToken.mint(minter, incrementAmount, { from: minter });
      await expectRevert(
        fiatToken.transfer(recipient, incrementAmount, { from: minter }),
        errorMessage
      );
    });

    it("should fail call transferFrom to recipient if balance will exceed 2^255", async () => {
      await fiatToken.mint(minter, incrementAmount, { from: minter });
      await fiatToken.approve(arbitraryAccount, incrementAmount, {
        from: minter,
      });

      await expectRevert(
        fiatToken.transferFrom(minter, recipient, incrementAmount, {
          from: arbitraryAccount,
        }),
        errorMessage
      );
    });

    context("EIP3009", () => {
      const signer = ACCOUNTS_AND_KEYS[0];
      const from = signer.address;
      const to = recipient;
      const value = incrementAmount;
      const validAfter = 0;
      const validBefore = MAX_UINT256_HEX;
      const nonce = hexStringFromBuffer(crypto.randomBytes(32));

      beforeEach(async () => {
        await fiatToken.mint(signer.address, incrementAmount, {
          from: minter,
        });
      });

      it("should fail to call transferWithAuthorization to recipient if balance will exceed 2^255", async () => {
        const signature = signTransferAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          domainSeparator,
          signer.key
        );

        await expectRevert(
          fiatToken.transferWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            ...prepareSignature(signature, SignatureBytesType.Packed),
            { from: to }
          ),
          errorMessage
        );
      });

      it("should fail to call receiveWithAuthorization to recipient if balance will exceed 2^255", async () => {
        const signature = signReceiveAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          domainSeparator,
          signer.key
        );

        await expectRevert(
          fiatToken.receiveWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            ...prepareSignature(signature, SignatureBytesType.Packed),
            { from: to }
          ),
          errorMessage
        );
      });
    });
  });
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
  fiatToken: FiatTokenV22InstanceExtended,
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
  ).map((result) => parseUint(result));
}
