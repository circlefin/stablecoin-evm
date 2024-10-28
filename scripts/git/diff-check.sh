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

# =============
# Utility script to check if two different commit hashes have the same content.
# =============

# The commit hashes to check.
COMMIT_HASH=$1
OTHER_COMMIT_HASH=$2

if [ -z "$COMMIT_HASH" ] || [ -z "$OTHER_COMMIT_HASH" ]; then
  echo "Usage: $0 <first commit hash to check> <second commit hash to check>"
  exit 1;
fi

echo "Getting the tree-ish hash of the first commit"
TREE_HASH=$(git cat-file commit $COMMIT_HASH | grep tree | sed 's/tree //g')
echo ">> Commit: $COMMIT_HASH, Tree: $TREE_HASH"

echo "Getting the tree-ish hash of the second commit"
OTHER_TREE_HASH=$(git cat-file commit $OTHER_COMMIT_HASH | grep tree | sed 's/tree //g')
echo ">> Commit: $OTHER_COMMIT_HASH, Tree: $OTHER_TREE_HASH"

if [ $TREE_HASH = $OTHER_TREE_HASH ];
then
  echo "Both commits have the same content!";
  exit 0;
else
  echo "Commits have different tree hashes. Content are different!";
  exit 1;
fi
