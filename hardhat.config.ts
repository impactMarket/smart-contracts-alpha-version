import { task, HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
// import "@nomiclabs/hardhat-ethers";
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-solhint';
import 'hardhat-typechain';
import 'solidity-coverage';
import 'hardhat-deploy';
import 'hardhat-tracer';

const config: HardhatUserConfig = {
    // Your type-safe config goes here
    solidity: '0.6.5',
    typechain: {
        outDir: 'types/',
        target: 'ethers-v5',
    },
    mocha: {
        timeout: 20000,
    },
    networks: {
        alfajores: {
            url: 'https://alfajores-forno.celo-testnet.org',
        },
    },
};

export default config;
