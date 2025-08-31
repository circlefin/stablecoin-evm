# QUSDC Deployment Summary (Qubetics Testnet)

## Deployed Addresses

- **SignatureChecker**: 0x8c72e0368594A0F7E479463503D06088E6b84994
- **FiatTokenV2_2 Implementation**: 0xB630D7E482B3d42Ff53B1e60dE68444BCab97678
- **FiatTokenProxy**: 0x944d3E439E9A9CBB1b600B8f7C55e435b1d7d37A
- **MasterMinter**: 0xC2BAe16964Bec333B0210fbF4014606F8D382102

## Roles

- **Proxy Admin**: 0x367898f42d91F17c170F10856fE643626E5aaFA9
- **Owner**: 0x367898f42d91F17c170F10856fE643626E5aaFA9
- **MasterMinter (on-chain)**: 0xC2BAe16964Bec333B0210fbF4014606F8D382102
- **MasterMinter (expected)**: 0x367898f42d91F17c170F10856fE643626E5aaFA9
- **Pauser**: 0x367898f42d91F17c170F10856fE643626E5aaFA9
- **Blacklister**: 0x367898f42d91F17c170F10856fE643626E5aaFA9

## Initialization

All initialize* methods completed successfully.

## Verification Results

- Proxy admin correct: true
- Implementation correct: true
- Owner correct: true
- MasterMinter correct: false (on-chain value differs from expected)
- Pauser correct: true
- Blacklister correct: true
- Total supply is zero: true
- Version is 2: true

## Transaction Hashes

- **SignatureChecker**: 0x56dbbb800bd98e88ccc3b7386edd35361f359356b2633e440f0d0bb0d73e4573
- **FiatTokenV2_2**: 0x49684cefbbed5d6d8d28ac59b881a8f569eeea05de94f57ece6d2a7403c4f0aa
- **FiatTokenProxy**: 0x623183a027e14dff392a12d2eea85ec0763213fcc3862c6bfe2693d9e9337f8c

---

This file records all contract addresses, role assignments, verification results, and transaction hashes for QUSDC deployment on Qubetics testnet.
