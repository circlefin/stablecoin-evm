DOCROOT="$( cd "$( dirname "$0" )" && pwd )"

# compile solidity contracts
docker-compose -f $DOCROOT/docker-compose.yml run --rm truffle compile

# run solidity tests
docker-compose -f $DOCROOT/docker-compose.yml run --rm truffle --network local_testnet test

#stop containers
docker-compose -f $DOCROOT/docker-compose.yml down
