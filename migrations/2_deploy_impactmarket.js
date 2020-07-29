const ImpactMarket = artifacts.require('ImpactMarket');
const CommunityFactory = artifacts.require('CommunityFactory');

module.exports = async (deployer, network, accounts) => {
    if (network === 'alfajores') {
        const cUSDAddress = '0x874069fa1eb16d44d622f2e0ca25eea172369bc1';
        await deployer.deploy(ImpactMarket, cUSDAddress, [
            // afonso address
            '0xd667ff2728475b298e28fe3c4a9ca2ad4fc162f1',
            // marco address
            '0x1ebd10f45daad2ed949cfd0e60ff36c3c941a556',
            // bernardo address
            '0x60f2b1ee6322b3aa2c88f497d87f65a15593f452',
        ]);
        const impactMarket = await ImpactMarket.deployed();
        await deployer.deploy(CommunityFactory, cUSDAddress, impactMarket.address);
        const communityFactory = await CommunityFactory.deployed();
        await impactMarket.initCommunityFactory(communityFactory.address);
        //
        // const message = 'Job losses in April likely topped 20 million and the unemployment rate hit a post-World War II high';
        // web3.eth.sendTransaction({
        //     from: accounts[0],
        //     gas: 188483,
        //     data: web3.utils.toHex(message),
        // });
    }
};
