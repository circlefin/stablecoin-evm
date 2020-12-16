import crypto from "crypto";
import {
  FiatTokenV2Instance,
  FiatTokenUtilInstance,
} from "../../../@types/generated";
import { ACCOUNTS_AND_KEYS, MAX_UINT256 } from "../../helpers/constants";
import {
  expectRevert,
  hexStringFromBuffer,
  strip0x,
  prepend0x,
  bytes32FromAddress,
} from "../../helpers";
import { signTransferAuthorization, TestParams } from "./helpers";
import { TransactionRawLog } from "../../../@types/TransactionRawLog";

const FiatTokenUtil = artifacts.require("FiatTokenUtil");
const ContractThatReverts = artifacts.require("ContractThatReverts");

export function testTransferWithMultipleAuthorizations({
  getFiatToken,
  getDomainSeparator,
  fiatTokenOwner,
  accounts,
}: TestParams): void {
  describe("transferWithMultipleAuthorizations", () => {
    let fiatToken: FiatTokenV2Instance;
    let fiatTokenUtil: FiatTokenUtilInstance;
    let domainSeparator: string;
    const [alice, bob] = ACCOUNTS_AND_KEYS;
    const charlie = accounts[1];
    let nonce: string;

    const initialBalance = 10e6;
    const transferParams = {
      from: alice.address,
      to: bob.address,
      value: 7e6,
      validAfter: 0,
      validBefore: MAX_UINT256,
    };

    beforeEach(async () => {
      fiatToken = getFiatToken();
      fiatTokenUtil = await FiatTokenUtil.new(fiatToken.address);
      domainSeparator = getDomainSeparator();
      nonce = hexStringFromBuffer(crypto.randomBytes(32));
      await fiatToken.configureMinter(fiatTokenOwner, 1000000e6, {
        from: fiatTokenOwner,
      });
      await fiatToken.mint(transferParams.from, initialBalance, {
        from: fiatTokenOwner,
      });
    });

    it("reverts if no transfer is provided", async () => {
      await expectRevert(
        fiatTokenUtil.transferWithMultipleAuthorizations("0x", "0x", true, {
          from: charlie,
        }),
        "no transfer provided"
      );
    });

    it("reverts if the FiatToken contract is paused", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // pause FiatToken
      await fiatToken.pause({ from: fiatTokenOwner });

      await expectRevert(
        fiatTokenUtil.transferWithMultipleAuthorizations(
          prepend0x(
            packParams(from, to, value, validAfter, validBefore, nonce)
          ),
          prepend0x(packSignatures(v, r, s)),
          true,
          {
            from: charlie,
          }
        ),
        "paused"
      );
    });

    it("reverts if the length of params is invalid", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      await expectRevert(
        fiatTokenUtil.transferWithMultipleAuthorizations(
          prepend0x(
            packParams(from, to, value, validAfter, validBefore, nonce)
          ) + "00", // add one more byte
          prepend0x(packSignatures(v, r, s)),
          true,
          {
            from: charlie,
          }
        ),
        "length of params is invalid"
      );
    });

    it("reverts if the length of signatures is invalid", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      await expectRevert(
        fiatTokenUtil.transferWithMultipleAuthorizations(
          prepend0x(
            packParams(from, to, value, validAfter, validBefore, nonce)
          ),
          prepend0x(packSignatures(v, r, s)) + "00", // add one more byte
          true,
          {
            from: charlie,
          }
        ),
        "length of signatures is invalid"
      );
    });

    it("can execute one transfer", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create an authorization to transfer money from Alice to Bob and sign
      // with Alice's key
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check initial balance
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(10e6);
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(0);

      // check that the authorization state is false
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(false);

      // a third-party, Charlie (not Alice) submits the signed authorization
      const result = await fiatTokenUtil.transferWithMultipleAuthorizations(
        prepend0x(packParams(from, to, value, validAfter, validBefore, nonce)),
        prepend0x(packSignatures(v, r, s)),
        true,
        { from: charlie }
      );

      // check that the balances are updated
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(
        initialBalance - value
      );
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(value);

      // check that AuthorizationUsed event is emitted
      const log0 = result.receipt.rawLogs[0] as TransactionRawLog;
      expect(log0.topics[0]).to.equal(
        web3.utils.keccak256("AuthorizationUsed(address,bytes32)")
      );
      expect(log0.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log0.topics[2]).to.equal(nonce);

      // check that Transfer event is emitted
      const log1 = result.receipt.rawLogs[1] as TransactionRawLog;
      expect(log1.address).to.equal(fiatToken.address);
      expect(log1.topics[0]).to.equal(
        web3.utils.keccak256("Transfer(address,address,uint256)")
      );
      expect(log1.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log1.topics[2]).to.equal(bytes32FromAddress(to));
      expect(
        Number(web3.eth.abi.decodeParameters(["uint256"], log1.data)[0])
      ).to.equal(value);

      // check that the authorization state is now true
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(true);
    });

    it("can execute multiple transfers", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;

      const to2 = charlie;
      const value2 = 1e6;
      const nonce2 = hexStringFromBuffer(crypto.randomBytes(32));

      // create an authorization to transfer money from Alice to Bob and sign
      // with Alice's key
      const transfer1 = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // create an authorization to transfer money from Alice to Charlie and
      // sign with Alice's key
      const transfer2 = signTransferAuthorization(
        from,
        to2,
        value2,
        validAfter,
        validBefore,
        nonce2,
        domainSeparator,
        alice.key
      );

      // check initial balance
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(10e6);
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(0);

      // check that the authorization state is false
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(false);
      expect(await fiatToken.authorizationState(from, nonce2)).to.equal(false);

      // a third-party, Charlie (not Alice) submits the signed authorization
      const result = await fiatTokenUtil.transferWithMultipleAuthorizations(
        prepend0x(
          packParams(from, to, value, validAfter, validBefore, nonce) +
            packParams(from, to2, value2, validAfter, validBefore, nonce2)
        ),
        prepend0x(
          packSignatures(transfer1.v, transfer1.r, transfer1.s) +
            packSignatures(transfer2.v, transfer2.r, transfer2.s)
        ),
        true,
        { from: charlie }
      );

      // check that the balances are updated
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(
        initialBalance - value - value2
      );
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(value);
      expect((await fiatToken.balanceOf(to2)).toNumber()).to.equal(value2);

      // check that AuthorizationUsed event for transfer 1 is emitted
      const log0 = result.receipt.rawLogs[0] as TransactionRawLog;
      expect(log0.topics[0]).to.equal(
        web3.utils.keccak256("AuthorizationUsed(address,bytes32)")
      );
      expect(log0.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log0.topics[2]).to.equal(nonce);

      // check that Transfer event for transfer 1 is emitted
      const log1 = result.receipt.rawLogs[1] as TransactionRawLog;
      expect(log1.address).to.equal(fiatToken.address);
      expect(log1.topics[0]).to.equal(
        web3.utils.keccak256("Transfer(address,address,uint256)")
      );
      expect(log1.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log1.topics[2]).to.equal(bytes32FromAddress(to));
      expect(
        Number(web3.eth.abi.decodeParameters(["uint256"], log1.data)[0])
      ).to.equal(value);

      // check that AuthorizationUsed event for transfer 2 is emitted
      const log2 = result.receipt.rawLogs[2] as TransactionRawLog;
      expect(log2.topics[0]).to.equal(
        web3.utils.keccak256("AuthorizationUsed(address,bytes32)")
      );
      expect(log2.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log2.topics[2]).to.equal(nonce2);

      // check that Transfer event for transfer 2 is emitted
      const log3 = result.receipt.rawLogs[3] as TransactionRawLog;
      expect(log3.address).to.equal(fiatToken.address);
      expect(log3.topics[0]).to.equal(
        web3.utils.keccak256("Transfer(address,address,uint256)")
      );
      expect(log3.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log3.topics[2]).to.equal(bytes32FromAddress(to2));
      expect(
        Number(web3.eth.abi.decodeParameters(["uint256"], log3.data)[0])
      ).to.equal(value2);

      // check that the authorization state is now true
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(true);
      expect(await fiatToken.authorizationState(from, nonce2)).to.equal(true);
    });

    it("does not revert if one of the transfers fail, but atomic is false", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;

      const to2 = charlie;
      const value2 = 3e6 + 1; // too much
      const nonce2 = hexStringFromBuffer(crypto.randomBytes(32));

      // create an authorization to transfer money from Alice to Bob and sign
      // with Alice's key
      const transfer1 = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // create an authorization to transfer money from Alice to Charlie and
      // sign with Alice's key. this will fail due to insufficient balance.
      const transfer2 = signTransferAuthorization(
        from,
        to2,
        value2,
        validAfter,
        validBefore,
        nonce2,
        domainSeparator,
        alice.key
      );

      // check initial balance
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(10e6);
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(0);

      // check that the authorization state is false
      expect(await fiatToken.authorizationState(from, nonce)).to.equal(false);
      expect(await fiatToken.authorizationState(from, nonce2)).to.equal(false);

      // a third-party, Charlie (not Alice) submits the signed authorization
      const result = await fiatTokenUtil.transferWithMultipleAuthorizations(
        prepend0x(
          packParams(from, to, value, validAfter, validBefore, nonce) +
            packParams(from, to2, value2, validAfter, validBefore, nonce2)
        ),
        prepend0x(
          packSignatures(transfer1.v, transfer1.r, transfer1.s) +
            packSignatures(transfer2.v, transfer2.r, transfer2.s)
        ),
        false,
        { from: charlie }
      );

      // check that the balances are updated
      expect((await fiatToken.balanceOf(from)).toNumber()).to.equal(
        initialBalance - value
      );
      expect((await fiatToken.balanceOf(to)).toNumber()).to.equal(value);
      expect((await fiatToken.balanceOf(to2)).toNumber()).to.equal(0);

      // check that AuthorizationUsed event for transfer 1 is emitted
      const log0 = result.receipt.rawLogs[0] as TransactionRawLog;
      expect(log0.topics[0]).to.equal(
        web3.utils.keccak256("AuthorizationUsed(address,bytes32)")
      );
      expect(log0.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log0.topics[2]).to.equal(nonce);

      // check that Transfer event for transfer 1 is emitted
      const log1 = result.receipt.rawLogs[1] as TransactionRawLog;
      expect(log1.address).to.equal(fiatToken.address);
      expect(log1.topics[0]).to.equal(
        web3.utils.keccak256("Transfer(address,address,uint256)")
      );
      expect(log1.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log1.topics[2]).to.equal(bytes32FromAddress(to));
      expect(
        Number(web3.eth.abi.decodeParameters(["uint256"], log1.data)[0])
      ).to.equal(value);

      // check that TransferFailed event for transfer 2 is emitted
      const log2 = result.receipt.rawLogs[2] as TransactionRawLog;
      expect(log2.address).to.equal(fiatTokenUtil.address);
      expect(log2.topics[0]).to.equal(
        web3.utils.keccak256("TransferFailed(address,bytes32)")
      );
      expect(log2.topics[1]).to.equal(bytes32FromAddress(from));
      expect(log2.topics[2]).to.equal(nonce2);
    });

    it("reverts if one of the transfers fail and atomic is true", async () => {
      const { from, to, value, validAfter, validBefore } = transferParams;

      const to2 = charlie;
      const value2 = 3e6 + 1; // too much
      const nonce2 = hexStringFromBuffer(crypto.randomBytes(32));

      // create an authorization to transfer money from Alice to Bob and sign
      // with Alice's key
      const transfer1 = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // create an authorization to transfer money from Alice to Charlie and
      // sign with Alice's key. this will fail due to insufficient balance.
      const transfer2 = signTransferAuthorization(
        from,
        to2,
        value2,
        validAfter,
        validBefore,
        nonce2,
        domainSeparator,
        alice.key
      );

      await expectRevert(
        fiatTokenUtil.transferWithMultipleAuthorizations(
          prepend0x(
            packParams(from, to, value, validAfter, validBefore, nonce) +
              packParams(from, to2, value2, validAfter, validBefore, nonce2)
          ),
          prepend0x(
            packSignatures(transfer1.v, transfer1.r, transfer1.s) +
              packSignatures(transfer2.v, transfer2.r, transfer2.s)
          ),
          true,
          { from: charlie }
        ),
        "transfer amount exceeds balance"
      );
    });

    it("reverts with a generic message if the call fails with a reason string", async () => {
      const reverter = await ContractThatReverts.new();
      fiatTokenUtil = await FiatTokenUtil.new(reverter.address);

      const { from, to, value, validAfter, validBefore } = transferParams;

      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      await reverter.setReason("something went wrong");

      await expectRevert(
        fiatTokenUtil.transferWithMultipleAuthorizations(
          prepend0x(
            packParams(from, to, value, validAfter, validBefore, nonce)
          ),
          prepend0x(packSignatures(v, r, s)),
          true,
          { from: charlie }
        ),
        "something went wrong"
      );
    });

    it("reverts with a generic message if the call fails with no reason string", async () => {
      const reverter = await ContractThatReverts.new();
      fiatTokenUtil = await FiatTokenUtil.new(reverter.address);

      const { from, to, value, validAfter, validBefore } = transferParams;

      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      await expectRevert(
        fiatTokenUtil.transferWithMultipleAuthorizations(
          prepend0x(
            packParams(from, to, value, validAfter, validBefore, nonce)
          ),
          prepend0x(packSignatures(v, r, s)),
          true,
          { from: charlie }
        ),
        "call failed"
      );
    });
  });
}

function packParams(
  from: string,
  to: string,
  value: number | string,
  validAfter: number | string,
  validBefore: number | string,
  nonce: string
): string {
  return (
    strip0x(from) +
    strip0x(to) +
    strip0x(
      web3.eth.abi.encodeParameters(
        ["uint256", "uint256", "uint256", "bytes32"],
        [value, validAfter, validBefore, nonce]
      )
    )
  );
}

function packSignatures(v: number, r: string, s: string): string {
  return v.toString(16).padStart(2, "0") + strip0x(r) + strip0x(s);
}
