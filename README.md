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

**NOTE**: ImpactMarket on Alfajores testnet is currently deployed at **0x74DF0a14C1358e78A904822ddCA8b85D969b3c3c**.

## Step by step...

- [x] Design and code base smart contracts
- [x] Deploy smart contracts to alfajores testnet
- [x] Refactor smart contracts (integrate with tokens, etc)
- [x] Deploy to alfajores testnet, integrating with cUSD
- [ ] ...

## License
[Apache-2.0](LICENSE)