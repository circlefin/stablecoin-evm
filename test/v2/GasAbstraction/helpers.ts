import { AnyFiatTokenV2Instance } from "../../../@types/AnyFiatTokenV2Instance";
import { MockErc1271WalletInstance } from "../../../@types/generated";
import { Signature, ecSign, strip0x } from "../../helpers";
import { packSignature } from "../../helpers";

export enum WalletType {
  EOA = "EOA",
  AA = "AA",
}

export enum SignatureBytesType {
  Packed = "Packed", // Signature provided in the format of a single byte array, packed in the order of r, s, v for EOA wallets
  Unpacked = "Unpacked", // Signature values provided as separate inputs (v, r, s)
}

export interface TestParams {
  version: number;
  getFiatToken: () => AnyFiatTokenV2Instance;
  getDomainSeparator: () => string;
  fiatTokenOwner: string;
  accounts: Truffle.Accounts;
  signerWalletType: WalletType;
  signatureBytesType: SignatureBytesType;
  getERC1271Wallet: (owner: string) => Promise<MockErc1271WalletInstance>;
}

export function makeDomainSeparator(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string
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
        verifyingContract,
      ]
    )
  );
}

export function prepareSignature(
  signature: Signature,
  signatureBytesType: SignatureBytesType
): Array<string | number | Buffer> {
  if (signatureBytesType == SignatureBytesType.Unpacked) {
    return [signature.v, signature.r, signature.s];
  } else {
    return [packSignature(signature)];
  }
}

export const transferWithAuthorizationTypeHash = web3.utils.keccak256(
  "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);

export const receiveWithAuthorizationTypeHash = web3.utils.keccak256(
  "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);

export const cancelAuthorizationTypeHash = web3.utils.keccak256(
  "CancelAuthorization(address authorizer,bytes32 nonce)"
);

export const permitTypeHash = web3.utils.keccak256(
  "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
);

/**
 * Overloaded method signatures
 */
export const permitSignature =
  "permit(address,address,uint256,uint256,uint8,bytes32,bytes32)";

export const permitSignatureV22 =
  "permit(address,address,uint256,uint256,bytes)";

export const transferWithAuthorizationSignature =
  "transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)";

export const transferWithAuthorizationSignatureV22 =
  "transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)";

export const receiveWithAuthorizationSignature =
  "receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)";

export const receiveWithAuthorizationSignatureV22 =
  "receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)";

export const cancelAuthorizationSignature =
  "cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)";

export const cancelAuthorizationSignatureV22 =
  "cancelAuthorization(address,bytes32,bytes)";

/**
 * Signature generation helper functions
 */
export function signTransferAuthorization(
  from: string,
  to: string,
  value: number | string,
  validAfter: number | string,
  validBefore: number | string,
  nonce: string,
  domainSeparator: string,
  privateKey: string
): Signature {
  return signEIP712(
    domainSeparator,
    transferWithAuthorizationTypeHash,
    ["address", "address", "uint256", "uint256", "uint256", "bytes32"],
    [from, to, value, validAfter, validBefore, nonce],
    privateKey
  );
}

export function signReceiveAuthorization(
  from: string,
  to: string,
  value: number | string,
  validAfter: number | string,
  validBefore: number | string,
  nonce: string,
  domainSeparator: string,
  privateKey: string
): Signature {
  return signEIP712(
    domainSeparator,
    receiveWithAuthorizationTypeHash,
    ["address", "address", "uint256", "uint256", "uint256", "bytes32"],
    [from, to, value, validAfter, validBefore, nonce],
    privateKey
  );
}

export function signCancelAuthorization(
  signer: string,
  nonce: string,
  domainSeparator: string,
  privateKey: string
): Signature {
  return signEIP712(
    domainSeparator,
    cancelAuthorizationTypeHash,
    ["address", "bytes32"],
    [signer, nonce],
    privateKey
  );
}

export function signPermit(
  owner: string,
  spender: string,
  value: number | string,
  nonce: number,
  deadline: number | string,
  domainSeparator: string,
  privateKey: string
): Signature {
  return signEIP712(
    domainSeparator,
    permitTypeHash,
    ["address", "address", "uint256", "uint256", "uint256"],
    [owner, spender, value, nonce, deadline],
    privateKey
  );
}

function signEIP712(
  domainSeparator: string,
  typeHash: string,
  types: string[],
  parameters: (string | number)[],
  privateKey: string
): Signature {
  const digest = web3.utils.keccak256(
    "0x1901" +
      strip0x(domainSeparator) +
      strip0x(
        web3.utils.keccak256(
          web3.eth.abi.encodeParameters(
            ["bytes32", ...types],
            [typeHash, ...parameters]
          )
        )
      )
  );

  return ecSign(digest, privateKey);
}
