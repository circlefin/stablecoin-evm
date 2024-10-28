#!/bin/bash
#
# Copyright 2024 Circle Internet Group, Inc. All rights reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

# Refer to https://github.com/foundry-rs/foundry/tags for the list of Foundry versions.
FOUNDRY_VERSION=nightly-f625d0fa7c51e65b4bf1e8f7931cd1c6e2e285e9

if [[ "$CI" == "true" ]]
then
  echo "Skipping as we are in the CI";
  exit;
fi

echo "Installing / Updating Foundry..."
if ! command -v foundryup &> /dev/null
then
  echo "Installing foundryup..."
  curl -L https://foundry.paradigm.xyz | bash

  FOUNDRY_BASE_DIR=${XDG_CONFIG_HOME:-$HOME}
  FOUNDRY_BIN_DIR="$FOUNDRY_BASE_DIR/.foundry/bin"
  export PATH="$FOUNDRY_BIN_DIR:$PATH"
fi

if ! command -v forge &> /dev/null || [ ! "$(forge -V | grep -Eo '\b\w{7}\b')" = $(echo $FOUNDRY_VERSION | cut -c '9-15') ]
then
  echo "Installing foundry at $FOUNDRY_VERSION..."
  foundryup --version $FOUNDRY_VERSION
fi

npm install -g dotenv-cli@7.3.0

echo "Updating git submodules..."
git submodule update --init --recursive
