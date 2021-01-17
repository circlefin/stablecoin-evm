import { behavesLikeRescuable } from "../v1.1/Rescuable.behavior";
import { FiatTokenV2Instance, RescuableInstance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { hasSafeAllowance } from "./safeAllowance.behavior";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import { expectRevert } from "../helpers";

const FiatTokenV2 = artifacts.require("FiatTokenV2");

contract("FiatTokenV2", (accounts) => {
  const fiatTokenOwner = accounts[9];
  let fiatToken: FiatTokenV2Instance;
  let domainSeparator: string;
  let chainId: number;

  beforeEach(async () => {
    fiatToken = await FiatTokenV2.new();
    await fiatToken.initialize(
      "Fuse Dollar",
      "fUSD",
      "USD",
      6,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner,
      fiatTokenOwner
    );
    await fiatToken.initializeV2("Fuse Dollar", { from: fiatTokenOwner });

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
          web3.utils.keccak256("Fuse Dollar"),
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
      fiatToken.initializeV2("Not Fuse Dollar", { from: fiatTokenOwner }),
      "contract is already initialized"
    );
  });
});
