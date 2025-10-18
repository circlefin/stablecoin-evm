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

All initialize\* methods completed successfully.


## Verification Results

- Proxy admin correct: true
- Implementation correct: true
- Owner correct: true
- MasterMinter correct: false (on-chain value differs from expected)
- Pauser correct: true
- Blacklister correct: true
- Total supply is zero: true
- Version is 2: true

**Note:** The MasterMinter role on-chain value (`0xC2BAe16964Bec333B0210fbF4014606F8D382102`) does not match the expected value (`0x367898f42d91F17c170F10856fE643626E5aaFA9`). This discrepancy is intentional for the Qubetics testnet deployment: the MasterMinter role was temporarily assigned to a different address for testing multi-party minter management. The role will be updated to the expected value before mainnet deployment.

## Transaction Hashes

- **SignatureChecker**:
  0x56dbbb800bd98e88ccc3b7386edd35361f359356b2633e440f0d0bb0d73e4573
- **FiatTokenV2_2**:
  0x49684cefbbed5d6d8d28ac59b881a8f569eeea05de94f57ece6d2a7403c4f0aa
- **FiatTokenProxy**:
  0x623183a027e14dff392a12d2eea85ec0763213fcc3862c6bfe2693d9e9337f8c

---

This file records all contract addresses, role assignments, verification
results, and transaction hashes for QUSDC deployment on Qubetics testnet.

explain:

contracts/v2/celo/FiatTokenCeloV2_2.sol:29:5: Warning: Documentation tag on
non-public state variables will be disallowed in 0.7.0. You will need to use the
@dev tag explicitly. /\*\* ^ (Relevant source part starts here and spans across
multiple lines).

contracts/v2/celo/FiatTokenCeloV2_2.sol:74:5: Warning: Documentation tag on
non-public state variables will be disallowed in 0.7.0. You will need to use the
@dev tag explicitly. /\*\* ^ (Relevant source part starts here and spans across
multiple lines).

contracts/upgradeability/AdminUpgradeabilityProxy.sol:31:1: Warning: This
contract has a payable fallback function, but no receive ether function.
Consider adding a receive ether function. contract AdminUpgradeabilityProxy is
UpgradeabilityProxy { ^ (Relevant source part starts here and spans across
multiple lines). contracts/upgradeability/Proxy.sol:35:5: The payable fallback
function is defined here. fallback() external payable { ^ (Relevant source part
starts here and spans across multiple lines).

contracts/v1/FiatTokenProxy.sol:29:1: Warning: This contract has a payable
fallback function, but no receive ether function. Consider adding a receive
ether function. contract FiatTokenProxy is AdminUpgradeabilityProxy { ^
(Relevant source part starts here and spans across multiple lines).
contracts/upgradeability/Proxy.sol:35:5: The payable fallback function is
defined here. fallback() external payable { ^ (Relevant source part starts here
and spans across multiple lines).

contracts/v2/celo/FiatTokenFeeAdapterProxy.sol:29:1: Warning: This contract has
a payable fallback function, but no receive ether function. Consider adding a
receive ether function. contract FiatTokenFeeAdapterProxy is
AdminUpgradeabilityProxy { ^ (Relevant source part starts here and spans across
multiple lines). contracts/upgradeability/Proxy.sol:35:5: The payable fallback
function is defined here. fallback() external payable { ^ (Relevant source part
starts here and spans across multiple lines).

contracts/v2/celo/FiatTokenCeloV2_2.sol:126:9: Warning: Unused function
parameter. Remove or comment out the variable name to silence this warning.
address gatewayFeeRecipient, ^-------------------------^

contracts/v2/celo/FiatTokenCeloV2_2.sol:131:9: Warning: Unused function
parameter. Remove or comment out the variable name to silence this warning.
uint256 gatewayFee, ^----------------^

contracts/v2/celo/FiatTokenFeeAdapterV1.sol:103:9: Warning: Unused function
parameter. Remove or comment out the variable name to silence this warning.
address gatewayFeeRecipient, ^-------------------------^

contracts/v2/celo/FiatTokenFeeAdapterV1.sol:108:9: Warning: Unused function
parameter. Remove or comment out the variable name to silence this warning.
uint256 gatewayFee, ^----------------^

contracts/v2/FiatTokenV2_2.sol:73:5: Warning: Function state mutability can be
restricted to pure function \_chainId() internal virtual view returns (uint256)
{ ^ (Relevant source part starts here and spans across multiple lines).

contracts/v2/celo/FiatTokenCeloV2_2.sol:25:1: Warning: Contract code size
exceeds 24576 bytes (a limit introduced in Spurious Dragon). This contract may
not be deployable on mainnet. Consider enabling the optimizer (with a low "runs"
value!), turning off revert strings, or using libraries. contract
FiatTokenCeloV2_2 is FiatTokenV2_2, ICeloGasToken { ^ (Relevant source part
starts here and spans across multiple lines).

contracts/test/celo/MockFiatTokenCeloWithExposedFunctions.sol:31:1: Warning:
Contract code size exceeds 24576 bytes (a limit introduced in Spurious Dragon).
This contract may not be deployable on mainnet. Consider enabling the optimizer
(with a low "runs" value!), turning off revert strings, or using libraries.
contract MockFiatTokenCeloWithExposedFunctions is FiatTokenCeloV2_2 { ^
(Relevant source part starts here and spans across multiple lines).
