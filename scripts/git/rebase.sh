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
# Utility script to perform interactive rebases using an editor of choice.
# =============

# Husky should be disabled so that pre-commit hook run per 'reword' rebase.
export HUSKY=0

# (Optional) Choose the editor that you want to use for rebasing. For sufficiently
# large rebases, it may be easier to use an editor with a GUI (eg. Sublime Text).
export GIT_EDITOR="subl -n -w" # Sublime Text
# GIT_EDITOR="vim"
# GIT_EDITOR="nano"

# The range of commits to rebase.
FROM_COMMIT_HASH=$1
TO_COMMIT_HASH=$2

if [ -z "$FROM_COMMIT_HASH" ] || [ -z "$TO_COMMIT_HASH" ]; then
  echo "Usage: $0 <commit hash to rebase from> <commit hash to rebase to>"
  exit 1;
fi

echo "Interactive rebasing from '$FROM_COMMIT_HASH' to '$TO_COMMIT_HASH' using '$GIT_EDITOR'..."
git rebase -i $FROM_COMMIT_HASH $TO_COMMIT_HASH
