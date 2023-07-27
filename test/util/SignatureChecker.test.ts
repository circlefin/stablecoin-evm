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
  MockMaliciousErc1271WalletInstance,
  MockErc1271WalletWithCustomValidationInstance,
} from "../../@types/generated";

const SignatureChecker = artifacts.require("SignatureChecker");
const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");
const MockMaliciousERC1271Wallet = artifacts.require(
  "MockMaliciousERC1271Wallet"
);
const MockERC1271WalletWithCustomValidation = artifacts.require(
  "MockERC1271WalletWithCustomValidation"
);

describe("SignatureChecker", () => {
  const digest = web3.utils.keccak256("Hello world!");
  const [account1, account2, account3] = ACCOUNTS_AND_KEYS;
  const sig1 = ecSign(digest, account1.key);
  const sig2 = ecSign(digest, account2.key);
  const sig3 = ecSign(digest, account3.key);

  let signatureChecker: SignatureCheckerInstance;
  let standardWallet: MockErc1271WalletInstance;
  let maliciousWallet: MockMaliciousErc1271WalletInstance;
  let customWallet: MockErc1271WalletWithCustomValidationInstance;

  beforeEach(async () => {
    signatureChecker = await SignatureChecker.new();
    standardWallet = await MockERC1271Wallet.new(account1.address);
    maliciousWallet = await MockMaliciousERC1271Wallet.new();
    customWallet = await MockERC1271WalletWithCustomValidation.new(
      account1.address
    );
  });

  context("EOA Wallet", () => {
    it("returns true when given a valid signature", async () => {
      expect(sig1).not.to.deep.equal(sig2);
      expect(sig1).not.to.deep.equal(sig3);
      expect(sig2).not.to.deep.equal(sig3);

      expect(
        await signatureChecker.isValidSignatureNow(
          account1.address,
          digest,
          packSig(sig1)
        )
      ).to.equal(true);
      expect(
        await signatureChecker.isValidSignatureNow(
          account2.address,
          digest,
          packSig(sig2)
        )
      ).to.equal(true);
      expect(
        await signatureChecker.isValidSignatureNow(
          account3.address,
          digest,
          packSig(sig3)
        )
      ).to.equal(true);
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
      expect(
        await signatureChecker.isValidSignatureNow(
          standardWallet.address,
          digest,
          packSig(sig1)
        )
      ).to.equal(true);
    });

    it("returns false when given a invalid signature", async () => {
      expect(
        await signatureChecker.isValidSignatureNow(
          standardWallet.address,
          digest,
          packSig(sig2)
        )
      ).to.equal(false);
    });
  });

  context("AA Wallet - malicious", () => {
    it("returns false when given a signature", async () => {
      expect(
        await signatureChecker.isValidSignatureNow(
          maliciousWallet.address,
          digest,
          packSig(sig1)
        )
      ).to.equal(false);
    });
  });

  context("AA Wallet - custom validation", () => {
    it("returns true when wallet considers signature to be valid", async () => {
      await customWallet.setSignatureValid(true);
      expect(
        await signatureChecker.isValidSignatureNow(
          customWallet.address,
          ZERO_BYTES32,
          "0x0"
        )
      ).to.equal(true);
    });

    it("returns false when wallet considers signature to be invalid", async () => {
      await customWallet.setSignatureValid(false);
      expect(
        await signatureChecker.isValidSignatureNow(
          customWallet.address,
          ZERO_BYTES32,
          "0x0"
        )
      ).to.equal(false);
    });
  });
});

export function packSig(sig: Signature): string {
  return hexStringFromBuffer(packSignature(sig));
}
