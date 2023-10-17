#!/usr/bin/env bash
#
# Copyright (c) 2023, Circle Internet Financial, LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

DOCROOT="$( cd "$( dirname "$0" )" && pwd )"
GANACHE_PID_FILE="${DOCROOT}/pids/ganache.pid"

usage()
{
cat <<EOF
usage: $0 options
This script starts Ganache in the background.
EOF
}

ping_ganache() {
    NAME=ganache
    URL=http://localhost:8545
    WAIT_TIME=30

    echo "$(date) : Waiting for service ${NAME} (url ${URL}) to come online within ${WAIT_TIME} seconds..."
    DURATION=0
    SECONDS=0

    while [[ ${DURATION} -lt ${WAIT_TIME} ]];
    do
        result=$(curl -k -s -o /dev/null -w %{http_code} -X POST -d "{\"jsonrpc\": \"2.0\", \"method\": \"eth_protocolVersion\"}" ${URL})
        if [[ ${result} -eq 200 ]]; then
            echo -e "$(date) : ${NAME} service is started after ${DURATION} seconds!!!\n"
            return 0
        fi

        # add a heartbeat every 10 seconds and show status
        if [[ $(( DURATION % 10 )) == 0 && ${DURATION} > 0 ]]; then
            echo -e "Waiting for ${NAME} for ${DURATION} seconds..\n"
        fi

        # ping every second
        sleep 1
        DURATION=$SECONDS

        # check to be sure the service didn't die under mysterious circumstances after 10 second grace period
        if [[ ${DURATION} -gt 10 ]] && [[ -e "${DOCROOT}/${NAME}.pid" ]]; then
            PID=$(cat ${GANACHE_PID_FILE})
            if ! kill -0 &>/dev/null ${PID}; then
                echo -e "$(date) : ${NAME} is not running after ${DURATION} seconds! Giving up!\n"
                # fast fail by breaking while when this occurs
                DURATION=${WAIT_TIME}
            fi
        fi
    done

    echo -e "$(date) : ${NAME} service failed to start within ${WAIT_TIME} seconds!!\n"
    echo -e "Last log entries for ${NAME}:\n"
    tail -n 200 "logs/${NAME}.log"
    exit 1
}

while getopts ":r" OPTION
do
    case ${OPTION} in
    r)
        RESTART=true
        ;;
    ?)
        usage
        exit
        ;;
    esac
done

if [[ ! -d "${DOCROOT}/logs" ]]; then
    mkdir "${DOCROOT}/logs"
fi

if [[ ! -d "${DOCROOT}/pids" ]]; then
    mkdir "${DOCROOT}/pids"
fi

if [[ "${RESTART}" = true ]] ; then
    echo 'Stopping ganache.'
    bash ${DOCROOT}/stop-ganache.sh
fi

if [[ -e "${GANACHE_PID_FILE}" ]];
then
    PID=$(cat ${GANACHE_PID_FILE})
    if kill -0 &>/dev/null ${PID}; then
        echo "Ganache is already running"
        exit
    else
        rm ${GANACHE_PID_FILE}
    fi
fi

echo "Starting Ganache..."

yarn ganache &> ${DOCROOT}/logs/ganache.log &
echo $! > $GANACHE_PID_FILE
ping_ganache

echo "All outputs will be logged to ${DOCROOT}/logs"
