import {
  Signature,
  ecSign,
  hexStringFromBuffer,
  packSignature,
} from "../helpers";
import {
  ACCOUNTS_AND_KEYS,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} from "../helpers/constants";
import { SignatureCheckerInstance } from "../../@types/generated/SignatureChecker";
import {
  MockErc1271WalletInstance,
  MockErc1271WalletReturningBytes32Instance,
  MockErc1271WalletWithCustomValidationInstance,
  MockStateModifyingErc1271WalletInstance,
} from "../../@types/generated";

const SignatureChecker = artifacts.require("SignatureChecker");
const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");
const MockERC1271WalletReturningBytes32 = artifacts.require(
  "MockERC1271WalletReturningBytes32"
);
const MockERC1271WalletWithCustomValidation = artifacts.require(
  "MockERC1271WalletWithCustomValidation"
);
const MockStateModifyingERC1271Wallet = artifacts.require(
  "MockStateModifyingERC1271Wallet"
);

describe("SignatureChecker", () => {
  const digest = web3.utils.keccak256("Hello world!");
  const [account1, account2, account3] = ACCOUNTS_AND_KEYS;
  const sig1 = ecSign(digest, account1.key);
  const sig2 = ecSign(digest, account2.key);
  const sig3 = ecSign(digest, account3.key);

  let signatureChecker: SignatureCheckerInstance;
  let standardWallet: MockErc1271WalletInstance;
  let walletReturningBytes32: MockErc1271WalletReturningBytes32Instance;
  let customWallet: MockErc1271WalletWithCustomValidationInstance;
  let stateModifyingWallet: MockStateModifyingErc1271WalletInstance;

  beforeEach(async () => {
    signatureChecker = await SignatureChecker.new();
    standardWallet = await MockERC1271Wallet.new(account1.address);
    walletReturningBytes32 = await MockERC1271WalletReturningBytes32.new();
    customWallet = await MockERC1271WalletWithCustomValidation.new(
      account1.address
    );
    stateModifyingWallet = await MockStateModifyingERC1271Wallet.new();
  });

  context("EOA Wallet", () => {
    it("returns true when given a valid signature", async () => {
      expect(sig1).not.to.deep.equal(sig2);
      expect(sig1).not.to.deep.equal(sig3);
      expect(sig2).not.to.deep.equal(sig3);

      await expectValidSignature(account1.address, digest, packSig(sig1));
      await expectValidSignature(account2.address, digest, packSig(sig2));
      await expectValidSignature(account3.address, digest, packSig(sig3));
    });

    it("returns false when given a invalid signature", async () => {
      expect(
        await signatureChecker.isValidSignatureNow(
          account1.address,
          digest,
          packSig(sig2)
        )
      ).to.equal(false);
    });

    it("returns false if signer is zero address", async () => {
      expect(
        await signatureChecker.isValidSignatureNow(
          ZERO_ADDRESS,
          digest,
          packSig(sig1)
        )
      ).to.equal(false);
    });
  });

  context("AA Wallet - standard", () => {
    it("returns true when given a valid signature", async () => {
      await expectValidSignature(standardWallet.address, digest, packSig(sig1));
    });

    it("returns false when given a invalid signature", async () => {
      await expectInvalidSignature(
        standardWallet.address,
        digest,
        packSig(sig2)
      );
    });
  });

  context("AA Wallet - walletReturningBytes32", () => {
    it("returns false when given a signature", async () => {
      await expectInvalidSignature(
        walletReturningBytes32.address,
        digest,
        packSig(sig1)
      );
    });
  });

  context("AA Wallet - custom validation", () => {
    it("returns true when wallet considers signature to be valid", async () => {
      await customWallet.setSignatureValid(true);
      await expectValidSignature(customWallet.address, ZERO_BYTES32, "0x0");
    });

    it("returns false when wallet considers signature to be invalid", async () => {
      await customWallet.setSignatureValid(false);
      await expectInvalidSignature(customWallet.address, ZERO_BYTES32, "0x0");
    });
  });

  context("AA Wallet - state modifying", () => {
    it("returns false for wallet contracts that omit the `view` modifier", async () => {
      expect(await stateModifyingWallet.evoked()).to.equal(false);

      await expectInvalidSignature(
        stateModifyingWallet.address,
        ZERO_BYTES32,
        "0x0"
      );

      // isValidSignature inside mock wallet is never evoked
      expect(await stateModifyingWallet.evoked()).to.equal(false);
    });
  });

  async function expectSignatureValidationResult(
    accountAddress: string,
    digest: string,
    signature: string,
    expectValidSignature: boolean
  ) {
    expect(
      await signatureChecker.isValidSignatureNow(
        accountAddress,
        digest,
        signature
      )
    ).to.equal(expectValidSignature);
  }

  async function expectValidSignature(
    accountAddress: string,
    digest: string,
    signature: string
  ) {
    await expectSignatureValidationResult(
      accountAddress,
      digest,
      signature,
      true
    );
  }

  async function expectInvalidSignature(
    accountAddress: string,
    digest: string,
    signature: string
  ) {
    await expectSignatureValidationResult(
      accountAddress,
      digest,
      signature,
      false
    );
  }
});

export function packSig(sig: Signature): string {
  return hexStringFromBuffer(packSignature(sig));
}
