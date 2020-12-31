import { task, HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
// import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-solhint";
import "hardhat-typechain";
import "solidity-coverage";
import 'hardhat-deploy';

import { newKit } from '@celo/contractkit';
import { getAccount } from './utils/getAccount';

// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (args, hre) => {
//     const accounts = await hre.ethers.getSigners();

//     for (const account of accounts) {
//         console.log(await account.address);
//     }
// });

// // You need to export an object to set up your config
// // Go to https://hardhat.org/config/ to learn more


// // Connect to the desired network
// // https://rc1-forno.celo-testnet.org
// // https://alfajores-forno.celo-testnet.org
// const kit = newKit('https://alfajores-forno.celo-testnet.org')

// // const getAccount = require('./utils/getAccount').getAccount

// async function awaitWrapper(){
//     let account = await getAccount()
//     console.log(`Account address: ${account.address}`)
//     kit.addAccount(account.privateKey)
// }

// awaitWrapper()


const config: HardhatUserConfig = {
    // Your type-safe config goes here
    solidity: "0.6.5",
    typechain: {
        outDir: "types/",
        target: "ethers-v5",
    },
    mocha: {
        timeout: 20000
    },
    networks: {
        alfajores: {
            url: 'http://localhost:8545',
        },
    },
};

export default config;