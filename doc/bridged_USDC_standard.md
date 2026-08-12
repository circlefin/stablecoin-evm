# Bridged USDC Standard

[Bridged USDC Standard](https://circle.com/blog/bridged-usdc-standard) is a
specification and process for deploying a bridged form of USDC on EVM
blockchains with optionality for Circle to seamlessly upgrade to native issuance
in the future.<sup>1</sup>

The result is a secure and standardized way for any EVM blockchain and rollup
team to transfer ownership of a bridged USDC token contract to Circle to
facilitate an upgrade to native USDC, if and when both parties deem
appropriate.<sup>2</sup>

This document provides a high-level overview of the process. Note that this also
applies to implementations of bridged EURC (Circle's euro-backed stablecoin), as
they follow the same implementation.

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
     bridging activity to finalize the total supply of bridged USDC on the
     destination chain.
   - Third-party team will securely re-assign the contract roles of the bridged
     USDC token contract to Circle.
   - Circle and the third-party team will jointly coordinate to burn an amount
     of native USDC locked in the bridge contract on the origin chain that
     equals the supply of bridged USDC on the destination chain and upgrade the
     bridged USDC token contract on the destination chain to native USDC.
4. The native USDC token contract seamlessly retains the existing supply,
   holders, and app integrations of the original bridged USDC token contract.

## Bridge Contracts

The third-party team's bridge contracts play an integral role in the process,
and must be upgradable in order to add the following functionality, which is
required to support the upgrade process.

1. (_Source and destination blockchains_) Ability to pause USDC bridging to
   create a lock on the supply.
2. (_Source blockchain_) Ability to burn locked USDC.

Circle recommends deferring adding this functionality to a later time through a
contract upgrade after Circle and the third-party team have jointly agreed to
proceed with an upgrade.

### 1) Ability to pause USDC bridging

The bridge contracts must be able to pause bridging, enabling a finalization of
the supply of the bridged token with that supply being fully backed by an amount
of native USDC on the source chain. How this is implemented is up to the
third-party team, but this functionality must be present before an upgrade can
take place.

### 2) Ability to burn locked USDC

A final step during the upgrade is to burn locked USDC in the source blockchain
bridge contract. To support this, Circle will temporarily assign the bridge
contract holding the USDC balance the role of a zero-allowance USDC minter. This
means that the bridge may burn its own held balance but not mint new supply.

To execute the burn, the bridge contract must expose a single function, only
callable by a Circle-controlled account. The signature of this function will be:

```
function burnLockedUSDC() external;
```

The specific implementation details are left up to the third-party team, but at
a minimum, the function must:

1. Be only callable by an address that Circle specifies closer to the time of
   the upgrade. Note that this address will not necessarily be the same address
   that is specified to call `transferUSDCRoles`.
2. Burn an amount of USDC held by the bridge that equals the total supply of
   bridged USDC finalized by the supply lock.

## Token Deployment

The third-party team's bridged USDC token contract is expected to be identical
to native USDC token contracts on other EVM blockchains. USDC uses a proxy
pattern, so the standard applies to both the implementation contract code and
the token proxy.

### Token Contract Code

Using identical code facilitates trustless contract verification by Circle and
supports a seamless integration with existing USDC services. To facilitate this,
the third-party team should:

1. Build the [FiatToken contracts](../README.md#contracts) from source. To
   ensure bytecode parity, the Solidity compiler configuration used should match
   the following settings:

   - Solidity version: 0.6.12
   - Optimizer runs: 10000000 (Partners should attempt to use the same number of
     optimizer runs, but may choose to reduce it if there are technical
     limitations)

   For suggested compiler settings that Circle uses, please refer to
   [foundry.toml](../foundry.toml).

2. Deploy the locally compiled FiatToken contracts. An overview of the
   deployment process can be found [here](./deployment.md).
3. Extract the compiler metadata used to generate the deployed contract's
   bytecode and make it available to Circle to support the contract verification
   process. The
   [compiler metadata](https://docs.soliditylang.org/en/v0.6.12/metadata.html#contract-metadata)
   is an autogenerated JSON file that can typically be found in the build
   directory on the local machine.

Circle's repository is equipped with build tools and scripts that streamline the
process above. The third-party team may refer to the steps listed
[here](../README.md#deployment) to run the deployment.

### Token Naming

Circle has recommended
[naming guidelines](https://brand.circle.com/d/M9z54TaEwsWL/stablecoins#/usdc-brand-guide/usdc-naming-guidelines)
for the Token Name and Token Symbol attributes of a bridged USDC or EURC token
contract that third-party teams are encouraged to follow. It is often the case
that USDC and EURC are bridged from Ethereum to a new destination blockchain,
and as such, the following is commonly used:

USDC

- Token Name: Bridged USDC (Third-Party Team)
- Token Symbol: USDC.e

EURC

- Token Name: Bridged EURC (Third-Party Team)
- Token Symbol: EURC.e

Note that the text shown in parentheses above would be the third-party team's
company name.

### IMPORTANT NOTE:

- Once deployed, the bridged token contract must not be upgraded to a new or
  different implementation at any time, outside of subsequent FiatToken versions
  authored by Circle.
- Once Circle decides to proceed with a bridge-to-native upgrade, the underlying
  bridge must not be modified or upgraded in any way.
- To be eligible for a bridge-to-native upgrade, the USDC and bridge contracts
  deployed on testnet must mirror the configuration used on mainnet.
- The third-party team, or bridge operator, must have a solid understanding of
  the bridge design and be prepared to provide guidance on bridge-related
  technical details.
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
in the repository that demonstrate patterns for deploying USDC/EURC and
configuring the implementation. For instance, there's an
[upgrader pattern](https://github.com/circlefin/stablecoin-evm/blob/35d66ae39f7038e30f04f87635f8bca6f8e38b04/migrations/versioned/8_deploy_v2_2_upgrader.js),
where a smart contract sets the FiatToken implementation contract and calls the
initialize functions within a single transaction.

### Token Roles

FiatToken uses a minter pattern, where minters can be configured via a master
minter role to mint up to an allowed amount. One way to adapt the minter pattern
to a bridged USDC or EURC token contract is to configure the destination bridge
as a solo minter.

The individual FiatToken roles (Owner, Pauser, Blacklister, MasterMinter) could
also be assigned to the bridge, or some other upgradeable contract, as long as
there's the ability to add a hook in the future to enable transferring the roles
to Circle.

If you would like more flexibility with permissioned minter configurations, you
may want to explore the Controller and `MinterController`
[contracts](https://github.com/circlefin/stablecoin-evm/tree/35d66ae39f7038e30f04f87635f8bca6f8e38b04/contracts/minting),
which come together to form the `MasterMinter` pattern.

#### Transferring the roles to Circle

There are several USDC roles that will be transferred to a Circle-owned address
at the time of the upgrade. Specifically these are:

- Implementation Owner:
  [defined](https://github.com/circlefin/stablecoin-evm/blob/657375471bff72afa5f625083bbab8003eb5f8c9/contracts/v1/Ownable.sol#L37)
  in the implementation contract, the Owner can re-assign all other roles
  (Owner, MasterMinter, Pauser, Rescuer, Blacklister).
- ProxyAdmin:
  [defined](https://github.com/circlefin/stablecoin-evm/blob/657375471bff72afa5f625083bbab8003eb5f8c9/contracts/upgradeability/AdminUpgradeabilityProxy.sol#L31)
  in the proxy contract, the ProxyAdmin can re-assign the ProxyAdmin and perform
  upgrades. By default, the proxy admin is not allowed to call any functions
  defined by the implementation contract.

It is up to the third-party team as to how they will secure and manage these
roles as part of their original bridged USDC deployment and its ongoing use
before a potential upgrade. For instance, the roles could be assigned to a EOA,
or assigned to a smart contract (like the bridge).

1. **Smart Contract Ownership**: If the roles are assigned to a smart contract
   (like the bridge), the contract must expose a function that Circle can call
   through a smart contract interaction to perform the role transfer at upgrade
   time.

2. **EOA Ownership**: If the roles are assigned to an EOA, the partner must plan
   to transfer them to a smart contract that exposes the same required function.

This function must have the following signature:

```
function transferUSDCRoles(address owner) external;
```

The function implementation details are left up to the partner, but it must:

1. Be only callable by an address that Circle specifies closer to the time of
   the upgrade. Note that this address will not necessarily be the same address
   that is specified to call `burnLockedUSDC`.
2. Transfer the Implementation Owner role to the address specified in the
   `owner` parameter.
3. Transfer the ProxyAdmin role to the function caller (if it is assigned to the
   bridge).

If the ProxyAdmin role is not assigned to the bridge contract, the partner
should transfer the role to an address that Circle specifies closer to the time
of the upgrade.

Additionally, the partner is expected to remove all configured minters prior to
(or concurrently with) transferring the roles to Circle.

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
   form of bridged USDC. Circle's decision to upgrade a particular form of
   bridged USDC to native USDC may be subject to additional terms and
   conditions. As noted in Section 8 of the
   [USDC Terms of Use](https://www.circle.com/en/legal/usdc-terms), bridged
   forms of USDC are subject to certain risks and are not issued by Circle. The
   same conditions apply to EURC.
2. The target blockchain will undergo Circle's internal Blockchain Due Diligence
   Process. That process involves reviews for both compliance and risk factors,
   as well as coverage for legal and technology risks, prior to approval. The
   diligence focuses on crypto and blockchain nuances, and an assessment of the
   strategic, financial, operational, technology, legal, and regulatory risks
   that are present.
