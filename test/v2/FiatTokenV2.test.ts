import { behavesLikeRescuable } from "../v1.1/Rescuable.behavior";
import { FiatTokenV2Instance, RescuableInstance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { hasSafeAllowance } from "./safeAllowance.behavior";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import { expectRevert } from "../helpers";

const ECRecover = artifacts.require("ECRecover");
const EIP712 = artifacts.require("EIP712");
const FiatTokenV2 = artifacts.require("FiatTokenV2");

contract("FiatTokenV2", (accounts) => {
  const fiatTokenOwner = accounts[9];
  let fiatToken: FiatTokenV2Instance;
  let domainSeparator: string;
  let chainId: number;

  beforeEach(async () => {
    const ecRecover = await ECRecover.new();
    EIP712.link("ECRecover", ecRecover.address);

    const eip712 = await EIP712.new();
    FiatTokenV2.link("EIP712", eip712.address);

    fiatToken = await FiatTokenV2.new();
    await fiatToken.initialize(
      "USD Coin",
      "USDC",
      "USD",
      6,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner
    );
    await fiatToken.initializeV2("USD Coin", { from: fiatTokenOwner });

    // hardcode chainId to be 1 due to ganache bug
    // https://github.com/trufflesuite/ganache/issues/1643
    // chainId = await web3.eth.getChainId();
    chainId = 1;

    domainSeparator = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          web3.utils.keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
          ),
          web3.utils.keccak256("USD Coin"),
          web3.utils.keccak256("2"),
          chainId,
          fiatToken.address,
        ]
      )
    );
  });

  behavesLikeRescuable(() => fiatToken as RescuableInstance, accounts);

  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV2,
    version: 2,
    accounts,
  });

  it("has the expected domain separator", async () => {
    expect(await fiatToken.DOMAIN_SEPARATOR()).to.equal(domainSeparator);
  });

  hasSafeAllowance(() => fiatToken, fiatTokenOwner, accounts);

  hasGasAbstraction(
    () => fiatToken,
    () => domainSeparator,
    fiatTokenOwner,
    accounts
  );

  it("disallows calling initializeV2 twice", async () => {
    // It was called once in beforeEach. Try to call again.
    await expectRevert(
      fiatToken.initializeV2("Not USD Coin", { from: fiatTokenOwner }),
      "contract is already initialized"
    );
  });
});
