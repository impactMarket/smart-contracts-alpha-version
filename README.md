<div align="center">
    <img style="max-width: 208px; width: 100%" src="logo.png">
</div>

> A decentralized impact-driven 2-sided marketplace to provide financial services to charities and vulnerable beneficiaries in need or living in extreme poverty.

<div align="center">
    <div>
        <a
            href="https://travis-ci.org/impactMarket/smart-contracts"><img
                src="https://travis-ci.org/impactMarket/smart-contracts.svg?branch=master" /></a>&emsp;
        <a href='https://coveralls.io/github/impactMarket/smart-contracts?branch=master'><img src='https://coveralls.io/repos/github/impactMarket/smart-contracts/badge.svg?branch=master' alt='Coverage Status' /></a>
    </div>
</div>

Welcome to the smart-contracts fraction of the impactMarket codebase.

## Installation

Use the package manager [yarn](https://yarnpkg.com/) to install dependencies.

```bash
yarn
```

## Usage

To deploy in a local network, start ganache with `yarn localnet`.

Deploy with `npx truffle deploy --network development`.

## Audit

Further information at [audits/README.md](audits/README.md).

### ImpactMarket on Alfajores Testnet
{
  impactMarket: '0x23611bDA8C4a048c22139b4a444f3E329E2046b4',
  communityFactory: '0x3B7e1ccEd164394Cb80DAe2A7C00b6cE77CEfF4D'
}

### ImpactMarket on Celo Mainnet
Currently deployed at **0xe55C3eb4a04F93c3302A5d8058348157561BF5ca** and *CommunityFactory* at **0xF3ba2c917b01627fb90673Aae0E170EE767Af8b6**.

## Useful tools and links
* [Celo Network Protocol Parameters](https://github.com/celo-org/celo-blockchain/blob/master/params/protocol_params.go)
* [Alfajores Blockscout](https://alfajores-blockscout.celo-testnet.org/)
* [Alfajores Bitquery Explorer](https://explorer.bitquery.io/celo_alfajores)

## License
[Apache-2.0](LICENSE)
