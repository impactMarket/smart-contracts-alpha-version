#!/bin/bash                                                                                            

set -e                                                                                                 

if [ $# -ne 1 ]                                                                                        
  then                                                                                                 
    echo 'Run a "mainnet-lightest" celo-blockchain node.'                                                      
    echo ''                                                                                            
    echo 'Usage: ./scripts/mainnet-mainnet-lightest-node.sh <network>'                                                 
    echo '  e.g. ./scripts/mainnet-mainnet-lightest-node.sh rc1'                                                       
    exit 1                                                                                             
fi                                                                                                     

NETWORK=$1                                                                                             
NETWORK_ID_FLAG=""                                                                                     
BOOTNODES_FLAG=""                                                                                      
CELO_IMAGE=us.gcr.io/celo-org/geth:${NETWORK}                                                 

if [ $NETWORK = "baklava" ]                                                                            
then                                                                                                   
  NETWORK_ID_FLAG="--networkid 40120"                                                                  
fi                                                                                                     

if [ $NETWORK = "mainnet" ]                                                                                
then                                                                                                   
  NETWORK_ID_FLAG="--networkid 42220"                                                                  
fi                                                                                                     

docker pull $CELO_IMAGE                                                                                
# docker stop celo-mainnet-lightest-node && docker rm celo-mainnet-lightest-node                                         
# BOOTNODES_FLAG="--bootnodes $(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"           
# docker run -it -v $PWD/node:/root/.celo/mainnet-light $CELO_IMAGE --nousb removedb                                   
# Delete the genesis block                                                                             
# rm -rf $PWD/node/celo/mainnet-light/*chaindata*                                                                      
# docker run --rm -it -v $PWD/node:/root/.celo/mainnet-light $CELO_IMAGE init /celo/genesis.json                       
# docker run --rm --entrypoint cat $CELO_IMAGE /celo/static-nodes.json > node/celo/static-nodes.json  
docker run --name celo-mainnet-lightest-node --restart unless-stopped -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD/node:/root/.celo/mainnet-light $CELO_IMAGE --verbosity 3 --syncmode lightest --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --nousb --allow-insecure-unlock ${NETWORK_ID_FLAG} ${BOOTNODES_FLAG}
