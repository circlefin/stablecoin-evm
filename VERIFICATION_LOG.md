# Bytecode Verification Log — FiatToken (NeoX Testnet)

**Date**: 2026-08-06
**Network**: NeoX Testnet (chainId: 12227332)
**RPC**: `https://testnet-1.rpc.banelabs.org`
**Script**: `scripts/verifyMainnetTokenBytecode.ts` (official Circle script)
**Verification mode**: `full` (constructor + full runtime bytecode + metadata hash)
**Command**:
```bash
forge build --skip scripts
./node_modules/.bin/hardhat run scripts/verifyMainnetTokenBytecode.ts --network mainnet
```
**Node**: v23.1.0 (Hardhat prints an unsupported-version warning but runs fine)
**Compiler**: Solc 0.6.12+commit.27d51765 (evm target: istanbul)
**Result**: ✅ EXIT CODE 0 — all three contracts verified in **full** mode.

---

## Deployment addresses (2026-08-06)

| Contract | Address | Creation Tx |
|---|---|---|
| SignatureChecker (Library) | `0x518e55b099E7fc78Cc59b45fe40a1B23C65dFd5B` | `0xad246bd3f0ecc4becf93000b2f4dcb0dbc8351014074e59e2c0a51db68e74044` |
| FiatTokenV2_2 (Implementation) | `0x9EED3835f283A3575f4f0d2EC98d26Be9F41244D` | `0xeeac8e2a3cc5c7b6fea1bda862a2cf4b630ed0c494dd0df4fe49b3cb1674cc84` |
| FiatTokenProxy | `0x6bc037Fa5421d7E53dA211A548d6539CBe12c8f3` | `0xbcd01e23197c8cfb1b195c004845dee68ef77ad458a5229fb1a0288091113dca` |
| MasterMinter | `0x4007CA68eFdD1f4BA1151c068FA6ddaB256fACca` | `0x333b80e735571c972d373980d92193b6a7fbb407da0ab7d1a869653548a1a4dc` |

---

## Verification results

```
 Verifying on chain bytecode for: FiatTokenV2_2

  verification complete - supplied constructor code is consistent with local version.
  verification complete - supplied full runtime bytecode is consistent with local version.

 Verifying on chain bytecode for: FiatTokenProxy

  verification complete - supplied constructor code is consistent with local version.
  verification complete - supplied full runtime bytecode is consistent with local version.

 Verifying on chain bytecode for: SignatureChecker

  verification complete - supplied constructor code is consistent with local version.
  verification complete - supplied full runtime bytecode is consistent with local version.
```

| Contract | Constructor | Full Runtime | Metadata Hash | Result |
|---|---|---|---|---|
| FiatTokenV2_2 | ✅ matches | ✅ matches | ✅ matches | ✅ PASS |
| FiatTokenProxy | ✅ matches | ✅ matches | ✅ matches | ✅ PASS |
| SignatureChecker | ✅ matches | ✅ matches | ✅ matches | ✅ PASS |

**Exit code**: 0

---

## Notes

- Verification is performed in **full** mode (`verificationType: "full"` in `verification_artifacts/input.json`), which verifies the constructor code, the complete runtime bytecode, and the embedded metadata hash against the local compilation.
- The `SignatureChecker` library was compiled with `libraries` set to the address recorded by the compiler at build time; the on-chain deployment matches the local build exactly, including the metadata hash.
- `FiatTokenV2_2` and `FiatTokenProxy` were compiled with `libraries = [SignatureChecker:0x518e55b099E7fc78Cc59b45fe40a1B23C65dFd5B]`, matching the on-chain linkage.
