#!/usr/bin/env bash
#
# Copyright (c) 2018-2023 CENTRE SECZ
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
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
