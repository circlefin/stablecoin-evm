#!/usr/bin/env bash
#
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
