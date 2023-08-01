import { Eip712TestInstance } from "../../@types/generated";
import { wordlist } from "ethereum-cryptography/bip39/wordlists/english";
import sampleSize from "lodash/sampleSize";
import { makeDomainSeparator } from "../helpers";

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
});
