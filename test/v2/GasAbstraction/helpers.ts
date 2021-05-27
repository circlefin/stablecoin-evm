import { FiatTokenV2Instance } from "../../../@types/generated";
import { Signature, ecSign, strip0x } from "../../helpers";

export interface TestParams {
  getFiatToken: () => FiatTokenV2Instance;
  getDomainSeparator: () => string;
  fiatTokenOwner: string;
  accounts: Truffle.Accounts;
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
