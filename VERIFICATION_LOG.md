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

---

# Bytecode Verification Log — FiatToken (NeoX Mainnet)

**Date**: 2026-08-14
**Network**: NeoX Mainnet (chainId: 47763)
**RPC**: `https://mainnet-1.rpc.banelabs.org`
**Script**: `scripts/verifyMainnetTokenBytecode.ts` (official Circle script)
**Verification mode**: `full` (constructor + full runtime bytecode + metadata hash)
**Command**:
```bash
forge build --skip scripts
./node_modules/.bin/hardhat run scripts/verifyMainnetTokenBytecode.ts --network mainnet
```
**Compiler**: Solc 0.6.12+commit.27d51765 (evm target: istanbul, optimizer 10,000,000 runs)
**Result**: ✅ EXIT CODE 0 — all three contracts verified in **full** mode.

---

## Deployment addresses (2026-08-14, fresh redeploy)

| Contract | Address | Creation Tx |
|---|---|---|
| SignatureChecker (Library) | `0xD99628bD77EfAe2DA7d8adA524BAa0d2FB28A1ca` | `0x2849eb500fbba6fa7653d4f621896698dc57a65cdcb6a8c5c84cbf51a4c4f499` |
| FiatTokenV2_2 (Implementation) | `0x2BDCDA0d8a5D9015908E52b53C282902147dB63e` | `0xe53dcce8dea7d2690edb4a2133a91d5e3ad853300b3ac75826896c0021a443c9` |
| FiatTokenProxy | `0x028447684F3fFb6d27042D6c3Da7B088332c6576` | `0xbb351846a192b416fdf71d5da611159908901d0ec0d2d003778ffcb65532645d` |
| MasterMinter | `0xC126Fa40260f5a55bA8c2C3ccBBBD247CBA6ddF9` | `0x9337cbeb039c8e5603e5727b2a79c59380a210fd13c444ff45aa2d7d95393314` |

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

## Block explorer verification (xexplorer — Blockscout)

All four contracts are publicly verified on https://xexplorer.neo.org via `forge verify-contract` (blockscout verifier, RPC `https://mainnet-1.rpc.banelabs.org`):

| Contract | Explorer status |
|---|---|
| SignatureChecker | ✅ Verified (`contracts/util/SignatureChecker.sol`) |
| FiatTokenV2_2 | ✅ Verified (`contracts/v2/FiatTokenV2_2.sol`) |
| FiatTokenProxy | ✅ Verified (`contracts/v1/FiatTokenProxy.sol`) |
| MasterMinter | ✅ Verified (`contracts/minting/MasterMinter.sol`) |

## Notes

- Fresh redeploy of the whole set on mainnet; `SignatureChecker` was deployed first via `forge create` (unlinked), then `FiatTokenV2_2`/`FiatTokenProxy`/`MasterMinter` were deployed with `--libraries contracts/util/SignatureChecker.sol:SignatureChecker:0xD99628bD77EfAe2DA7d8adA524BAa0d2FB28A1ca`.
- Verification artifacts carry `settings.libraries.SignatureChecker = 0xD99628bD77EfAe2DA7d8adA524BAa0d2FB28A1ca`, matching the on-chain linkage.
- Role assignments: proxy admin = SimpleMultiSig `0x0F378b…`, token owner / pauser / blacklister / MM owner = Gnosis Safe `0xc81C12…`.
