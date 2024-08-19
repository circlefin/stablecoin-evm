#!/bin/bash
#
# Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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

# =========================================================
# Utility script to check if the validate contract bytecode
# at the current commit against the audited commit.
# =========================================================

# Prerequisites for using this script:
# Download `./jq` commandline at: https://jqlang.github.io/jq/
brew install jq

# The contract name and commit hashes to check.
CONTRACT_NAME=$1
AUDITED_COMMIT_HASH=$2
VERIFICATION_TYPE=$3

# Get current commit hash
CURRENT_COMMIT_HASH=$(git rev-parse HEAD)

if [ -z "$CONTRACT_NAME" ] || [ -z "$AUDITED_COMMIT_HASH" ] || [ -z "$VERIFICATION_TYPE" ];
then
  echo "Usage: $0 <contract name> <audited commit hash> <verification_type(full/partial)>"
  exit 1;
fi

if [ "$VERIFICATION_TYPE" != "full" ] && [ "$VERIFICATION_TYPE" != "partial" ];
then
  echo "Invalid contract verification type (full/partial)!"
  exit 1;
fi

if [ ! -z "$(git status -suno)" ];
then
  echo "Must commit unstaged changes before proceeding!"
  exit 1;
fi

echo "Beginning $VERIFICATION_TYPE verification..."

echo "Ensuring node_modules/ is up to date"
yarn install --frozen-lockfile

# Compile and fetch bytecode at the audited commit
echo "Getting compiled bytecode for the audited commit..."
git reset --hard $AUDITED_COMMIT_HASH
git show $CURRENT_COMMIT_HASH:truffle-config.js > truffle-config.js
rm -rf build/
VERIFICATION_TYPE=$VERIFICATION_TYPE yarn truffle compile --quiet
AUDITED_BYTECODE=$(cat build/contracts/$CONTRACT_NAME.json | jq '.bytecode')

# Compile and fetch bytecode at the current commit
echo "Getting compiled bytecode for the current commit..."
git reset --hard $CURRENT_COMMIT_HASH
rm -rf build/
VERIFICATION_TYPE=$VERIFICATION_TYPE yarn truffle compile --quiet
CURRENT_BYTECODE=$(cat build/contracts/$CONTRACT_NAME.json | jq '.bytecode')

# Compare current bytecode against audited contract bytecode
if [ "$AUDITED_BYTECODE" == "$CURRENT_BYTECODE" ];
then
  printf "\e[32mBoth commits produce the same contract bytecode\!";
  exit 0;
fi

printf "\e[33mWARNING: Contract bytecode differs from audited commit\!";
exit 1;
