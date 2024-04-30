# Changelog

## 2.2.0, Celo variant (2024-04-08)

- Add `ICeloGasToken` and `IFiatTokenFeeAdapter` per Celo documentation
- Add `FiatTokenFeeAdapterProxy` and `FiatTokenFeeAdapterV1` to support USDC as
  gas on Celo
- Implement `debitGasFees` and `creditGasFees` in `FiatTokenCeloV2_2`

## 2.2.0 (2023-11-09)

- Add ERC-1271 signature validation support to EIP-2612 and EIP-3009 functions
- Combine the balance state and the blacklist state for an address in a
  `balanceAndBlacklistStates` map to reduce gas usage
- Update `DOMAIN_SEPARATOR` to be a dynamic value
- Remove `notBlacklisted` modifiers for `approve`, `increaseAllowance`,
  `decreaseAllowance` and `permit`
- Enable bypassing `TIMESTAMP` opcode in `permit` by using `uint256.max`

## 2.1.1 (2021-06-03)

- Add the multi-issuer minter contracts from the `multi-issuer` branch

## 2.1.0 (2021-02-17)

- Move locked USDC to a "lost and found" address and blacklists itself so that
  accidental sends will no longer be possible
- Conform to EIP-3009 in FiatToken
  - Add `receiveWithAuthorization`
  - Remove `approveWithAuthorization`, `increaseAllowanceWithAuthorization` and
    `decreaseAllowanceWithAuthorization`

## 2.0.0 (2020-07-30)

- Add support for EIP-2612 in FiatToken
- Add `transferWithAuthorization`, `approveWithAuthorization`,
  `increaseAllowanceWithAuthorization`, `decreaseAllowanceWithAuthorization` to
  enable ETH-less transactions
- Add `increaseAllowance` and `decreaseAllowance` to mitigate the
  multi-withdrawal attack vulnerability in ERC-20 `approve` function
- Update Solidity version to `0.6.12`

## 1.1.0 (2020-05-27)

- Add Rescuable functionalities to FiatToken
- Update Solidity version to `0.6.8`
- Remove `ifAdmin` modifier from admin() and implementation() in FiatTokenProxy

## 1.0.0 (2018-07-24)

- Create ERC-20 compliant FiatToken contract
- Add Ownable, Pausable and Blacklistable functionalities to FiatToken
- Create FiatTokenProxy contracts based on Zeppelinos's Unstructured-Storage
  Proxy pattern
