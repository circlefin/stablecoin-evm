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
npx tsx scripts/injective/namespaceRotation/generateUnsignedTransaction.ts \
  --network <network> \
  --usdc-proxy <address> \
  --role-manager-admin <address> \
  --sequence <number> \
  [--new-policy-admin <address>] \
  [--new-contract-hook-admin <address>] \
  [--new-role-permissions-admin <address>]
```

**Arguments:**

- `--network <network>` - Network to use: `local`, `testnet`, or `mainnet`
  (required)
- `--usdc-proxy <address>` - USDC proxy contract address (required)
- `--role-manager-admin <address>` - Current role manager admin's EVM address
  (required)
- `--sequence <number>` - Current sequence number of the role manager admin
  account (required)
- `--new-policy-admin <address>` - New policy admin's EVM address (optional)
- `--new-contract-hook-admin <address>` - New contract hook admin's EVM address
  (optional)
- `--new-role-permissions-admin <address>` - New role permissions admin's EVM
  address (optional)

**Notes:**

- Role managers CANNOT be rotated through this script
- All addresses must be in EVM format (0x...)
- At least one `--new-*-admin` argument must be provided
- Script fetches account number from network automatically
- **Sequence number must be provided explicitly** - This ensures the transaction
  uses the correct nonce for the account

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
`npx tsx scripts/injective/queryNamespace.ts --network <network> --proxy <address>`

---

### 4. Broadcast Transaction

Broadcasts a signed transaction to the Injective network. script will be
executed by the cold storage team. Output will be a signed cosmos transaction.

**Notes:**

- Verifies network matches transaction
- Requires network connection
- Transaction is irreversible once broadcasted
