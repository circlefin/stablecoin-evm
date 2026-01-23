<!--
 Copyright 2026 Circle Internet Group, Inc. All rights reserved.

 SPDX-License-Identifier: Apache-2.0

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->

# Namespace Actor Role Rotation Scripts

## Overview

Four steps for rotating namespace admin roles on Injective:

1. **generateUnsignedTransaction.ts** - Creates unsigned transaction JSON
2. **signTransaction.ts** - [not in this repo] Signs transaction offline
   (air-gapped)
3. **decodeTransaction.ts** - Decodes and displays transaction details
4. **broadcastTransaction.ts** - [not in this repo] Broadcasts signed
   transaction to network

## Script Usage

### 1. Generate Unsigned Transaction

Creates an unsigned transaction JSON file for rotating admin roles.

**What to verify in the output JSON**

- Make sure the admin to be revoked matches the existing admin address with the
  same role
- Make sure the sender is actually the role manager
- Make sure we do not attempt to modify the role manager

```bash
NETWORK=<network> \
ROLE_MANAGER_ADMIN=<evm_address> \
NEW_<ROLE>=<evm_address> \
npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts <USDC_PROXY_ADDRESS>
```

**Environment Variables:**

- `NETWORK` - Network to use: `local`, `testnet`, or `mainnet` (required)
- `ROLE_MANAGER_ADMIN` - Current role manager admin's EVM address (required)
- `NEW_POLICY_ADMIN` - New policy admin's EVM address (optional)
- `NEW_CONTRACT_HOOK_ADMIN` - New contract hook admin's EVM address (optional)
- `NEW_ROLE_PERMISSIONS_ADMIN` - New role permissions admin's EVM address
  (optional)

**Notes:**

- Role managers CANNOT be rotated through this script
- All addresses must be in EVM format (0x...)
- At least one NEW\_\*\_ADMIN variable must be set
- Script fetches account number from network automatically
- Sequence is always set to 0

---

### 2. Sign Transaction

Signs an unsigned transaction offline using the role manager's private key. The
script will be executed by the cold storage team. Output will be a signed cosmos
transaction.

---

### 3. Decode Transaction

Decodes and displays a signed transaction in human-readable JSON format.

```bash
npx tsx scripts/injective/namespaceRotation/decodeTransaction.ts <signed_tx.json> [--with-evm-addresses]
```

**Options:**

- `--with-evm-addresses` - Show EVM address conversions alongside Injective
  addresses (optional)

**Notes:**

- No network required
- Pure JSON decoder
- Use this to verify transaction contents before broadcasting
  - Make sure the sender address is the role manager and has enough INJ
  - Make sure the sender sequence is correct
  - Make sure the admin to be revoked matches the existing admin address with
    the same role
  - Make sure we do not attempt to modify the role manager

To retrieve the current namespace status, use
`NETWORK=<network> npx tsx scripts/injective/queryNamespace.ts <proxy_address>`

---

### 4. Broadcast Transaction

Broadcasts a signed transaction to the Injective network. script will be
executed by the cold storage team. Output will be a signed cosmos transaction.

**Notes:**

- Verifies network matches transaction
- Requires network connection
- Transaction is irreversible once broadcasted
