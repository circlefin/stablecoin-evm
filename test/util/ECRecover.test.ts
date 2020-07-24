import { ecSign, expectRevert } from "../helpers";
import { ACCOUNTS_AND_KEYS, ZERO_BYTES32 } from "../helpers/constants";
import { EcRecoverTestInstance } from "../../@types/generated/EcRecoverTest";

const ECRecoverTest = artifacts.require("ECRecoverTest");

contract("ECRecover", (_accounts) => {
  let ecRecover: EcRecoverTestInstance;

  beforeEach(async () => {
    ecRecover = await ECRecoverTest.new();
  });

  describe("recover", () => {
    const digest = web3.utils.keccak256("Hello world!");
    const [account1, account2, account3] = ACCOUNTS_AND_KEYS;
    const sig1 = ecSign(digest, account1.key);
    const sig2 = ecSign(digest, account2.key);
    const sig3 = ecSign(digest, account3.key);

    it("recovers signer address from a valid signature", async () => {
      expect(sig1).not.to.deep.equal(sig2);
      expect(sig1).not.to.deep.equal(sig3);
      expect(sig2).not.to.deep.equal(sig3);

      expect(await ecRecover.recover(digest, sig1.v, sig1.r, sig1.s)).to.equal(
        account1.address
      );
      expect(await ecRecover.recover(digest, sig2.v, sig2.r, sig2.s)).to.equal(
        account2.address
      );
      expect(await ecRecover.recover(digest, sig3.v, sig3.r, sig3.s)).to.equal(
        account3.address
      );
    });

    it("reverts if an invalid signature is given", async () => {
      await expectRevert(
        ecRecover.recover(digest, 27, ZERO_BYTES32, ZERO_BYTES32),
        "invalid signature"
      );
    });

    it("reverts if an invalid v value is given", async () => {
      await expectRevert(
        ecRecover.recover(digest, sig1.v - 2, sig1.r, sig1.s),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(digest, sig2.v - 2, sig2.r, sig2.s),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(digest, sig3.v - 2, sig3.r, sig3.s),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(digest, sig1.v + 2, sig1.r, sig1.s),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(digest, sig2.v + 2, sig2.r, sig2.s),
        "invalid signature 'v' value"
      );
      await expectRevert(
        ecRecover.recover(digest, sig3.v + 2, sig3.r, sig3.s),
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
        ecRecover.recover(dig, v, r, s),
        "invalid signature 's' value"
      );
    });
  });
});
