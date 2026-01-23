/**
 * Copyright 2026 Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  MsgCreateNamespace as MsgCreateNamespaceType,
  Namespace as NamespaceType,
} from "./namespace_pb";

/**
 * Wrapper for MsgCreateNamespace that adds toBinary method for SDK compatibility
 */
export class MsgCreateNamespaceWrapper {
  sender: string;
  namespace?: NamespaceType;

  constructor(data: { sender: string; namespace?: NamespaceType }) {
    this.sender = data.sender;
    this.namespace = data.namespace;
  }

  /**
   * Create a message compatible with Injective SDK's createTransaction
   */
  static create(data: {
    sender: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    namespace?: any;
  }): MsgCreateNamespaceWrapper {
    return new MsgCreateNamespaceWrapper(data);
  }

  /**
   * Serialize message to binary format (required by SDK)
   */
  toBinary(): Uint8Array {
    return MsgCreateNamespaceType.toBinary({
      sender: this.sender,
      namespace: this.namespace,
    });
  }

  /**
   * Convert to DirectSign format (required by SDK)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toDirectSign(): { type: string; message: any } {
    return {
      type: "/injective.permissions.v1beta1.MsgCreateNamespace",
      message: {
        sender: this.sender,
        namespace: this.namespace,
      },
    };
  }

  /**
   * Get the protobuf type URL
   */
  static get typeUrl(): string {
    return "/injective.permissions.v1beta1.MsgCreateNamespace";
  }
}

export { NamespaceType as Namespace };
