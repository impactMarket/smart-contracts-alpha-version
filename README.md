<div align="center">
    <img style="max-width: 208px; width: 100%" src="logo.png">
</div>

> A decentralized impact-driven 2-sided marketplace to provide financial services to charities and vulnerable beneficiaries in need or living in extreme poverty.

Welcome to the smart-contracts fraction of the impactMarket codebase.

<div align="center">
    <div>
        <a
            href="https://travis-ci.org/impactMarket/smart-contracts"><img
                src="https://travis-ci.org/impactMarket/smart-contracts.svg?branch=master" /></a>&emsp;
        <a href='https://coveralls.io/github/impactMarket/smart-contracts?branch=master'><img src='https://coveralls.io/repos/github/impactMarket/smart-contracts/badge.svg?branch=master' alt='Coverage Status' /></a>
    </div>
</div>

## Installation

Use the package manager [yarn](https://yarnpkg.com/) to install dependencies.

```bash
yarn
```

## Usage

To deploy in a local network, start ganache with `yarn local-testnet`.

Deploy with `npx truffle deploy --network development`.

**NOTE**: *ImpactMarket* on Alfajores testnet is currently deployed at **0xc70cC218AE84cfDb0De11783082c49E3702092fb** and *CommunityFactory* at **0x87E1C49797EC7b0C785AE8EE8148254911884959**.

## Step by step...

- [x] Design and code base smart contracts
- [x] Deploy smart contracts to alfajores testnet
- [x] Refactor smart contracts (integrate with tokens, etc)
- [x] Deploy to alfajores testnet, integrating with cUSD
- [ ] Create a community migration system (WIP)
- [ ] ...

## Useful tools and links
* https://github.com/celo-org/celo-blockchain/blob/master/params/protocol_params.go
* https://alfajores-blockscout.celo-testnet.org/
* https://explorer.bitquery.io/celo_alfajores

## License
[Apache-2.0](LICENSE)