<!--
 Copyright 2025 Circle Internet Group, Inc. All rights reserved.

 SPDX-License-Identifier: Apache-2.0

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at:

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is provided on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->

# Local Testing for Create2 Deployment

## Prerequisites

Start a local RPC node at <http://127.0.0.1:8485> by running `yarn hardhat node`
or `anvil`.

Duplicate the `.env.example` file and populate it with the required
configuration values, including:

- Token roles and metadata
- `DEPLOYER_ADDRESS`

## Steps for Generating Deployment Transactions

### Step 1: Deploy test Create2Factory Contract

Run the following command to deploy a test instance of the `Create2Factory`
contract:

```sh
forge create Create2Factory -r http://127.0.0.1:8545 --private-key $DEPLOYER_PRIVATE_KEY
```

Add the deployed `Create2Factory` contract address to your `.env` file under the
variable `CREATE2_FACTORY_CONTRACT_ADDRESS`.

### Step 2: Generate Deployment Transactions for SignatureChecker

Generate the `SignatureChecker` deployment transaction using this command:

```sh
yarn forge:simulate scripts/deploy/create2/deploy-signature-checker.s.sol \
--json \
--rpc-url http://127.0.0.1:8545 \
--libraries contracts/util/SignatureChecker.sol:SignatureChecker:0x0000000000000000000000000000000000000000
```

Record the deployed SignatureChecker contract address to be used in the next
step:

```sh
export SIGNATURE_CHECKER_ADDRESS=...
```

### Step 3: Generate Deployment Transactions for FiatTokenV2_2, FiatTokenProxy, and MasterMinter

Minters can be configured by making a copy of `minters.example.json`, naming it
`minters.json` and filling up the arrays with the corresponding values. If you
do not need to configure minters, make a copy of the minters file and leave the
arrays unfilled.

Run the following command to generate deployment transactions for
`FiatTokenV2_2`, `FiatTokenProxy`, and `MasterMinter`:

```sh
yarn forge:simulate scripts/deploy/create2/deploy-fiat-token-create2.s.sol \
--json \
--rpc-url http://127.0.0.1:8545 \
--libraries contracts/util/SignatureChecker.sol:SignatureChecker:$SIGNATURE_CHECKER_ADDRESS
```

### Step 4: Locate Generated JSON Files

The generated JSON files will be available in the `broadcast` directory and can
be used for signing.
