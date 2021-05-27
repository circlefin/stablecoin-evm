import crypto from "crypto";
import { Eip712TestInstance } from "../../@types/generated";
import { wordlist } from "ethereum-cryptography/bip39/wordlists/english";
import sampleSize from "lodash/sampleSize";
import { ACCOUNTS_AND_KEYS } from "../helpers/constants";
import { prepend0x, strip0x, ecSign } from "../helpers";

const EIP712Test = artifacts.require("EIP712Test");

contract("EIP712", (_accounts) => {
  let eip712: Eip712TestInstance;
  let chainId: number;
  let randomName: string;
  let randomVersion: string;
  let domainSeparator: string;

  beforeEach(async () => {
    eip712 = await EIP712Test.new();

    // hardcode chainId to be 1 due to ganache bug
    // https://github.com/trufflesuite/ganache/issues/1643
    // chainId = await web3.eth.getChainId();
    chainId = 1;

    randomName = sampleSize(wordlist, 3).join(" ");
    randomVersion = (Math.floor(Math.random() * 10) + 1).toString();
    domainSeparator = makeDomainSeparator(
      randomName,
      randomVersion,
      chainId,
      eip712.address
    );
  });

  describe("makeDomainSeparator", () => {
    it("generates a EIP712 domain separator", async () => {
      expect(
        await eip712.makeDomainSeparator(randomName, randomVersion)
      ).to.equal(domainSeparator);
    });
  });

  describe("recover", () => {
    it("recovers the signer's address from signed data", async () => {
      const randomAccount =
        ACCOUNTS_AND_KEYS[Math.floor(Math.random() * ACCOUNTS_AND_KEYS.length)];
      const randomData = prepend0x(crypto.randomBytes(256).toString("hex"));
      const eip712Data = prepend0x(
        "1901" +
          strip0x(domainSeparator) +
          strip0x(web3.utils.keccak256(randomData))
      );

      const { v, r, s } = ecSign(
        web3.utils.keccak256(eip712Data),
        randomAccount.key
      );

      expect(
        await eip712.recover(domainSeparator, v, r, s, randomData)
      ).to.equal(randomAccount.address);
    });
  });
});

function makeDomainSeparator(
  name: string,
  version: string,
  chainId: number,
  address: string
): string {
  return web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        web3.utils.keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        web3.utils.keccak256(name),
        web3.utils.keccak256(version),
        chainId,
        address,
      ]
    )
  );
}
