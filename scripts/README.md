```
$ ./mainnet-lightest-node.sh rc1
// if by any chance sees "permission denied", execute `sudo chown user:group -R node`
// another command line
$ docker exec -it celo-lightest-node geth attach
// inside docker
$() > personal.importRawKey(..params..)
$() > personal.unlockAccount(..params..)
// another command line, deploy contracts to mainnet
```