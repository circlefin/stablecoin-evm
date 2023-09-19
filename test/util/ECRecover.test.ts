import { bufferFromHexString, ecSign, expectRevert } from "../helpers";
import { ACCOUNTS_AND_KEYS, ZERO_BYTES32 } from "../helpers/constants";
import { EcRecoverTestInstance } from "../../@types/generated/EcRecoverTest";
import { packSig } from "./SignatureChecker.test";
import { toCompactSig } from "ethereumjs-util";

const ECRecoverTest = artifacts.require("ECRecoverTest");

describe("ECRecover", () => {
  const digest = web3.utils.keccak256("Hello world!");
  const [account1, account2, account3] = ACCOUNTS_AND_KEYS;
  const sig1 = ecSign(digest, account1.key);
  const sig2 = ecSign(digest, account2.key);
  const sig3 = ecSign(digest, account3.key);

  let ecRecover: EcRecoverTestInstance;

  beforeEach(async () => {
    ecRecover = await ECRecoverTest.new();
  });
  describe("recover", () => {
    it("recovers signer address from a valid signature", async () => {
      expect(sig1).not.to.deep.equal(sig2);
      expect(sig1).not.to.deep.equal(sig3);
      expect(sig2).not.to.deep.equal(sig3);

      expect(await ecRecover.recover(digest, packSig(sig1))).to.equal(
        account1.address
      );
      expect(await ecRecover.recover(digest, packSig(sig2))).to.equal(
        account2.address
      );
      expect(await ecRecover.recover(digest, packSig(sig3))).to.equal(
        account3.address
      );
    });

    it("reverts if an invalid signature is given", async () => {
      await expectRevert(
        ecRecover.recover(
          digest,
          packSig({ v: 27, r: ZERO_BYTES32, s: ZERO_BYTES32 })
        ),
        "invalid signature"
      );
    });

    it("reverts if an invalid v value is given", async () => {
      await expectRevert(
        ecRecover.recover(
          digest,
          packSig({ v: sig1.v - 2, r: sig1.r, s: sig1.s })
        ),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(
          digest,
          packSig({ v: sig2.v - 2, r: sig2.r, s: sig2.s })
        ),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(
          digest,
          packSig({ v: sig3.v - 2, r: sig3.r, s: sig3.s })
        ),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(
          digest,
          packSig({ v: sig1.v + 2, r: sig1.r, s: sig1.s })
        ),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(
          digest,
          packSig({ v: sig2.v + 2, r: sig2.r, s: sig2.s })
        ),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(
          digest,
          packSig({ v: sig3.v + 2, r: sig3.r, s: sig3.s })
        ),
        "invalid signature 'v' value"
      );
    });

    it("reverts if an high-s value is given", async () => {
      const dig =
        "0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
      const v = 27;
      const r =
        "0xe742ff452d41413616a5bf43fe15dd88294e983d3d36206c2712f39083d638bd";
      const s =
        "0xe0a0fc89be718fbc1033e1d30d78be1c68081562ed2e97af876f286f3453231d";

      await expectRevert(
        ecRecover.recover(dig, packSig({ v, r, s })),
        "invalid signature 's' value"
      );
    });

    it("reverts if signature has incorrect length", async () => {
      const compactSig: string = toCompactSig(
        sig1.v,
        bufferFromHexString(sig1.r),
        bufferFromHexString(sig1.s)
      );

      await expectRevert(
        ecRecover.recover(digest, compactSig),
        "invalid signature length"
      );
    });
  });
});
