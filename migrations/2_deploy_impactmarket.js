const ImpactMarket = artifacts.require('ImpactMarket');

module.exports = async (deployer, network, accounts) => {
    if (network === 'alfajores') {
        const cUSDAddress = '0xa561131a1C8aC25925FB848bCa45A74aF61e5A38';
        await deployer.deploy(ImpactMarket, cUSDAddress);
        const impactMarket = await ImpactMarket.deployed();
        //
        // const message = 'Job losses in April likely topped 20 million and the unemployment rate hit a post-World War II high';
        // web3.eth.sendTransaction({
        //     from: accounts[0],
        //     gas: 188483,
        //     data: web3.utils.toHex(message),
        // });
        // testnet addresses
        // afonso address
        await impactMarket.addWhitelistAdmin('0xd667ff2728475b298e28fe3c4a9ca2ad4fc162f1');
        // marco address
        await impactMarket.addWhitelistAdmin('0x1ebd10f45daad2ed949cfd0e60ff36c3c941a556');
        // bernardo address
        await impactMarket.addWhitelistAdmin('0x60f2b1ee6322b3aa2c88f497d87f65a15593f452');
    }
};
