/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
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

import { execSync } from "child_process";

/**
 * Utility function to trigger a sleep.
 * @param ms the period to sleep for
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility function to validate a supplied optimizerRuns
 * @param optimizerRuns the supplied value for optimizerRuns
 */
export function validateOptimizerRuns(optimizerRuns: number): void {
  if (!Number.isInteger(optimizerRuns) || optimizerRuns < 0) {
    throw new Error("invalid optimizerRuns");
  }
}

/**
 * Wrapper for execSync so that execSync can be mocked in tests.
 * Mocking execSync directly with Sinon results in the error
 *"TypeError: Descriptor for property execSync is non-configurable and non-writable"
 * @param command the command to execute
 */
export function execSyncWrapper(command: string): void {
  execSync(command);
}
