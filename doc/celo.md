# Circle's Celo `FiatToken` design

This documentation explains the Celo-specific logic implemented by Circle for
supporting `FiatToken` on the [Celo](https://celo.org/) network.

The overall process for adding a new supported gas token to the Celo network is
provided on
[official documentation](https://docs.celo.org/learn/add-gas-currency), which
covers the token implementation, oracle work required, and the governance
proposal process.

## Overview of debiting and crediting

To see the interface, refer to `ICeloGasToken`. The Celo virtual machine calls
`debitGasFees` and `creditGasFees` atomically as part of a transaction from the
core Celo VM's state transition algorithm. See
[the source code](https://github.com/celo-org/celo-blockchain/blob/3808c45addf56cf547581599a1cb059bc4ae5089/core/state_transition.go#L426-L526)
from `celo-org/celo-blockchain`, notably on lines 481 (`payFees`) and 517
(`distributeTxFees`).

Only the Celo VM, which calls through `address(0)`, should be able to call
`debitGasFees` and `creditGasFees`, which necessitates the use of a special
modifier, an example of which can be found in
[Celo's monorepo](https://github.com/celo-org/celo-monorepo/blob/fff103a6b5bbdcfe1e8231c2eef20524a748ed07/packages/protocol/contracts/common/CalledByVm.sol#L3).

## Overview of `FiatTokenFeeAdapter`

To see the interface, refer to `IFiatTokenFeeAdapter`. The Celo chain supports
using ERC-20 tokens to pay for gas. For ERC-20 tokens that have a decimal field
other than 18, the Celo chain uses the
[FeeCurrencyAdapter](https://github.com/celo-org/celo-monorepo/blob/release/core-contracts/11/packages/protocol/contracts-0.8/stability/FeeCurrencyAdapter.sol)
strategy to ensure that the decimal conversion is fair. The deployed USDC
adapters can be found in
[Celo's official documentation](https://docs.celo.org/protocol/transaction/erc20-transaction-fees#tokens-with-adapters).

## Deployment

`FiatTokenCeloV2_2`'s deployment process is the same as the base `FiatTokenV2_2`
[deployment process](./../README.md). Follow all the steps described in the
deployment process, but be sure to run `deploy-fiat-token-celo` script instead
of the base `deploy-fiat-token` script:

```sh
yarn forge:simulate scripts/deploy/celo/deploy-fiat-token-celo.s.sol --rpc-url <testnet OR mainnet>
```

For the `FiatTokenFeeAdapter` deployment, be sure to fill in the required fields
in the `.env` file. Namely, `FIAT_TOKEN_CELO_PROXY_ADDRESS`,
`FEE_ADAPTER_PROXY_ADMIN_ADDRESS`, and `FEE_ADAPTER_DECIMALS` must be filled.
Then, deploy by running the following command:

```sh
yarn forge:simulate scripts/deploy/celo/deploy-fee-adapter.s.sol --rpc-url <testnet OR mainnet>
```
