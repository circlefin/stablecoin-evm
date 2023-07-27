import {
  bufferFromHexString,
  hexStringFromBuffer,
  makeDomainSeparator,
} from "../helpers";
import { MessageHashUtilsTestInstance } from "../../@types/generated";

const MessageHashUtils = artifacts.require("MessageHashUtilsTest");

contract("MessageHashUtils", function () {
  context("toTypedDataHash", function () {
    it("returns the digest correctly", async function () {
      const messageHashUtils: MessageHashUtilsTestInstance = await MessageHashUtils.new();
      const structhash: string = web3.utils.randomHex(32);
      const domainSeparator: string = makeDomainSeparator(
        "USD Coin",
        "2",
        1,
        messageHashUtils.address
      );
      expect(
        await messageHashUtils.toTypedDataHash(domainSeparator, structhash)
      ).to.equal(hashTypedData(domainSeparator, structhash));
    });
  });
});

function hashTypedData(domainSeparator: string, structHash: string): string {
  return web3.utils.keccak256(
    hexStringFromBuffer(
      Buffer.concat(
        ["0x1901", domainSeparator, structHash].map((str) =>
          bufferFromHexString(str)
        )
      )
    )
  );
}
