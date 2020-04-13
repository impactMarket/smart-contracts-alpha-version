// const Kit = require('@celo/contractkit')
// const path = require('path')

// // Connect to the desired network
// const kit = Kit.newKit('https://alfajores-forno.celo-testnet.org')

// const getAccount = require('./utils/getAccount').getAccount

// async function awaitWrapper() {
//     let account = await getAccount()
//     console.log(`Account address: ${account.address}`)
//     kit.addAccount(account.privateKey)
// }

// awaitWrapper()

require('ts-node/register');
module.exports = {
    test_file_extension_regexp: /.*\.ts$/,
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!

    // The following line will put the compiled contracts and associated info at ./client/contracts
    // contracts_build_directory: path.join(__dirname, "client/contracts"),

    networks: {
        // Use the development network if you are using @celo/ganache-cli
        // https://www.npmjs.com/package/@celo/ganache-cli
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
        },

        alfajores: {
            host: "127.0.0.1",
            port: 8545,
            network_id: 44786
        },

        // this is necessary for coverage
        coverage: {
            host: 'localhost',
            network_id: '*', // eslint-disable-line camelcase
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01,
        }
    },

    // Set default mocha options here, use special reporters etc.
    mocha: {
        timeout: 100000,
    },

    plugins: ['solidity-coverage']
};
