require('dotenv').config({ path: '../.env' })
const ImpactMarket = artifacts.require('ImpactMarket');
const CommunityFactory = artifacts.require('CommunityFactory');


module.exports = async (deployer, network, accounts) => {
    if (network === 'alfajores') {
        const cUSDAddress = process.env.CUSD_ALFAJORES_ADDRESS;
        await deployer.deploy(ImpactMarket, cUSDAddress, [
            process.env.MARCO_STAGING_WALLET_ADDRESS,
            process.env.AFONSO_STAGING_WALLET_ADDRESS,
            process.env.BERNARDO_STAGING_WALLET_ADDRESS,
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
