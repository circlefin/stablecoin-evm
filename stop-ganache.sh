# Copyright (c) 2023, Circle Internet Financial Trading Company Limited.
# All rights reserved.
#
# Circle Internet Financial Trading Company Limited CONFIDENTIAL
#
# This file includes unpublished proprietary source code of Circle Internet
# Financial Trading Company Limited, Inc. The copyright notice above does not
# evidence any actual or intended publication of such source code. Disclosure
# of this source code or any related proprietary information is strictly
# prohibited without the express written permission of Circle Internet Financial
# Trading Company Limited.

DOCROOT="$( cd "$( dirname "$0" )" && pwd )"
PIDS_DIRECTORY="${DOCROOT}/pids"

for arg in "ganache.pid"
    do
        if [[ -e "${PIDS_DIRECTORY}/${arg}" ]]; then
            echo "Stopping ${arg}"
            PID=$(cat "$PIDS_DIRECTORY/${arg}")
            kill "${PID}" &>/dev/null
            rm "${PIDS_DIRECTORY}/${arg}"
        fi
    done
