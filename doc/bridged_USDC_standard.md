# Bridged USDC Standard

[Bridged USDC Standard](https://circle.com/blog/bridged-usdc-standard) is a
specification and process for deploying a bridged form of USDC on EVM
blockchains with optionality for Circle to seamlessly upgrade to native issuance
in the future.<sup>1</sup>

The result is a secure and standardized way for any EVM blockchain and rollup
team to transfer ownership of a bridged USDC token contract to Circle to
facilitate an upgrade to native USDC, if and when both parties deem
appropriate.<sup>2</sup>

This document provides a high-level overview of the process. Note that this is
also extensible to implementations of bridged EURC (Circle’s euro-backed
stablecoin).

## How it works

1. Third-party team follows the standard to deploy their bridge contracts, or
   retains the ability to upgrade their bridge contracts in the future to
   incorporate the required functionality. (See
   [Bridge Contracts](#bridge-contracts))
2. Third-party team follows the standard to deploy their bridged USDC token
   contract. (See [Token Deployment](#token-deployment))
3. If and when a joint decision is made by the third-party team and Circle to
   securely transfer ownership of the bridged USDC token contract to Circle and
   perform an upgrade to native USDC, the following will take place:
   - Third-party team will pause bridging activity and reconcile in-flight
     bridging activity to harmonize the total supply of native USDC locked on
     the origin chain with the total supply of bridged USDC on the destination
     chain.
   - Third-party team will securely re-assign the contract roles of the bridged
     USDC token contract to Circle.
   - Circle and the third-party team will jointly coordinate to burn the supply
     of native USDC locked in the bridge contract on the origin chain and
     upgrade the bridged USDC token contract on the destination chain to native
     USDC.
4. The native USDC token contract seamlessly retains the existing supply,
   holders, and app integrations of the original bridged USDC token contract.

### Bridge Contracts

The third-party team’s bridge contracts must be upgradeable to add required,
specific functionality at a later point in time to support the upgrade steps
above, once Circle and the third-party team jointly decide to perform the
upgrade.

### Token Deployment

The third-party team’s bridged USDC token contract is expected to be identical
to native USDC token contracts on other EVM blockchains. USDC uses a proxy
pattern, so the standard applies to both the implementation contract code and
the token proxy.

**Token Contract Code**

Using identical code facilitates trustless contract verification by Circle and
supports a seamless integration with existing USDC services. To facilitate this,
the third-party team may choose one of the following:

- Copy previously deployed bytecode from a recent, native USDC token contract
  deployment (both proxy and implementation) on an EVM blockchain, for example
  [Arbitrum](https://arbiscan.io/token/0xaf88d065e77c8cc2239327c5edb3a432268e5831),
  [Base](https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913),
  [OP Mainnet](https://optimistic.etherscan.io/token/0x0b2c639c533813f4aa9d7837caf62653d097ff85),
  or
  [Polygon PoS](https://polygonscan.com/token/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359).
  Note that you must supply different constructor and initializer parameters
  where needed.
- Build the
  [FiatToken contracts](https://github.com/circlefin/stablecoin-evm#contracts)
  from source. In this case, the compiler
  [metadata](https://docs.soliditylang.org/en/latest/metadata.html) must be
  published or made available to support full contract verification. Various
  suggested compiler settings that Circle uses can be found
  [here](https://github.com/circlefin/stablecoin-evm/blob/35d66ae39f7038e30f04f87635f8bca6f8e38b04/truffle-config.js#L34-L45),
  which will allow the third-party team to reach the same bytecode if followed
  consistently.

**Token Naming**

Circle has recommended
[naming guidelines](https://brand.circle.com/d/M9z54TaEwsWL/stablecoins#/usdc-brand-guide/usdc-naming-guidelines)
for the Token Name and Token Symbol attributes of a bridged USDC token contract
that third-party teams are encouraged to follow. It is often the case that USDC
is bridged from Ethereum to a new destination blockchain, and as such, the
following is commonly used:

- Token Name: Bridged USDC (Third-Party Team)
- Token Symbol: USDC.e

Note that the text shown in parentheses above would be the third-party team’s
company name.

**IMPORTANT NOTE:**

- Once deployed, the bridged USDC token contract must not be upgraded to a new
  or different implementation at any time, outside of subsequent FiatToken
  versions authored by Circle.
- FiatToken has a number of one-time use initialization functions (listed below)
  that are not permissioned, and therefore should be called during contract
  deployment.
  - Due to the proxy pattern used by FiatToken, after (or while) specifying the
    current implementation that the proxy points to, these initialization
    functions must be called to set the values correctly on the proxy's storage.
    If not, then any caller could invoke them in the future.
  - It is also recommended to call these functions directly on the
    implementation contract itself, separately from the proxy, to disallow any
    outside caller invoking them later. At the timing of writing, these
    initialization functions include:
    - [initialize](https://github.com/circlefin/stablecoin-evm/blob/405efc100c016ed1a437063b6274b4e24ea7b8b1/contracts/v1/FiatTokenV1.sol#L67)
    - [initializeV2](https://github.com/circlefin/stablecoin-evm/blob/405efc100c016ed1a437063b6274b4e24ea7b8b1/contracts/v2/FiatTokenV2.sol#L37)
    - [initializeV2_1](https://github.com/circlefin/stablecoin-evm/blob/405efc100c016ed1a437063b6274b4e24ea7b8b1/contracts/v2/FiatTokenV2_1.sol#L34)
    - [initializeV2_2](https://github.com/circlefin/stablecoin-evm/blob/405efc100c016ed1a437063b6274b4e24ea7b8b1/contracts/v2/FiatTokenV2_2.sol#L41)

There are a number of reference
[deployment scripts](https://github.com/circlefin/stablecoin-evm/tree/35d66ae39f7038e30f04f87635f8bca6f8e38b04/migrations/direct)
in the repository that demonstrate patterns for deploying USDC and configuring
the implementation. For instance, there’s an
[upgrader pattern](https://github.com/circlefin/stablecoin-evm/blob/35d66ae39f7038e30f04f87635f8bca6f8e38b04/migrations/versioned/8_deploy_v2_2_upgrader.js),
where a smart contract sets the FiatToken implementation contract and calls the
initialize functions within a single transaction.

**Token Roles**

FiatToken uses a minter pattern, where minters can be configured via a master
minter role to mint up to an allowed amount. One way to adapt the minter pattern
to a bridged USDC token contract is to configure the destination bridge as a
solo minter.

The individual FiatToken roles (Owner, Pauser, Blacklister, MasterMinter) could
also be assigned to the bridge, or some other upgradeable contract, as long as
there's the ability to add a hook in the future to enable transferring the roles
to Circle.

If you would like more flexibility with permissioned minter configurations, you
may want to explore the `Controller` and `MinterController`
[contracts](https://github.com/circlefin/stablecoin-evm/tree/35d66ae39f7038e30f04f87635f8bca6f8e38b04/contracts/minting),
which come together to form the `MasterMinter` pattern.

## For more information

Please reach out on [our Discord](https://discord.com/invite/buildoncircle) if
you have questions that were not addressed in this document. We value feedback
and suggestions from the community to improve our documentation.

---

1. Bridged USDC Standard grants Circle the option, but not the obligation, to
   obtain ownership of the token contract and upgrade to native USDC.
   Additionally, Bridged USDC Standard must be incorporated prior to deploying a
   bridged USDC token contract as it cannot be retroactively applied. The
   requirements provided are for informational purposes only and will apply
   should Circle choose to upgrade a particular form of bridged USDC to native
   USDC. These requirements do not constitute an offer to upgrade a particular
   form of bridged USDC. Circle’s decision to upgrade a particular form of
   bridged USDC to native USDC may be subject to additional terms and
   conditions. As noted in Section 8 of the
   [USDC Terms of Use](https://www.circle.com/en/legal/usdc-terms), bridged
   forms of USDC are subject to certain risks and are not issued by Circle.
2. The target blockchain will undergo Circle’s internal Blockchain Due Diligence
   Process. That process involves reviews for both compliance and risk factors,
   as well as coverage for legal and technology risks, prior to approval. The
   diligence focuses on crypto and blockchain nuances, and an assessment of the
   strategic, financial, operational, technology, legal, and regulatory risks
   that are present.
