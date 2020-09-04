#!/bin/bash                                                                                            

set -e                                                                                                 

if [ $# -ne 1 ]                                                                                        
  then                                                                                                 
    echo 'Run a "lightest" celo-blockchain node.'                                                      
    echo ''                                                                                            
    echo 'Usage: ./scripts/mainnet-lightest-node.sh <network>'                                                 
    echo '  e.g. ./scripts/mainnet-lightest-node.sh rc1'                                                       
    exit 1                                                                                             
fi                                                                                                     

NETWORK=$1                                                                                             
NETWORK_ID_FLAG=""                                                                                     
BOOTNODES_FLAG=""                                                                                      
CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:${NETWORK}                                                 

if [ $NETWORK = "baklava" ]                                                                            
then                                                                                                   
  NETWORK_ID_FLAG="--networkid 40120"                                                                  
fi                                                                                                     

if [ $NETWORK = "rc1" ]                                                                                
then                                                                                                   
  NETWORK_ID_FLAG="--networkid 42220"                                                                  
fi                                                                                                     

docker pull $CELO_IMAGE                                                                                
docker stop celo-lightest-node && docker rm celo-lightest-node                                         
BOOTNODES_FLAG="--bootnodes $(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"           
docker run -it -v $PWD/node:/root/.celo $CELO_IMAGE --nousb removedb                                   
# Delete the genesis block                                                                             
rm -rf $PWD/node/celo/*chaindata*                                                                      
docker run --rm -it -v $PWD/node:/root/.celo $CELO_IMAGE init /celo/genesis.json                       
docker run --rm --entrypoint cat $CELO_IMAGE /celo/static-nodes.json > node/celo/static-nodes.json  
docker run --name celo-lightest-node --restart unless-stopped -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD/node:/root/.celo $CELO_IMAGE --verbosity 3 --syncmode lightest --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --nousb --allow-insecure-unlock ${NETWORK_ID_FLAG} ${BOOTNODES_FLAG}
