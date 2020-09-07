require('dotenv').config({ path: '../.env' })
const ImpactMarket = artifacts.require('ImpactMarket');
const CommunityFactory = artifacts.require('CommunityFactory');


module.exports = (deployer, network, accounts) => {
    if (network === 'alfajores') {
        const cUSDAddress = process.env.CUSD_ALFAJORES_ADDRESS;
        deployer.deploy(ImpactMarket, cUSDAddress, [
            process.env.BERNARDO_STAGING_WALLET_ADDRESS,
        ]);
        deployer.then(async () => {
            const impactMarket = await ImpactMarket.deployed();
            await deployer.deploy(CommunityFactory, cUSDAddress, impactMarket.address);
            const communityFactory = await CommunityFactory.deployed();
            await impactMarket.initCommunityFactory(communityFactory.address);
        });
        //
        // const message = 'Job losses in April likely topped 20 million and the unemployment rate hit a post-World War II high';
        // web3.eth.sendTransaction({
        //     from: accounts[0],
        //     gas: 188483,
        //     data: web3.utils.toHex(message),
        // });
    } else if (network === 'mainnet') {
        const accountDeploying = process.env.MAINNET_DEPLOY_ADDRESS;
        const cUSDAddress = '0x765de816845861e75a25fca122bb6898b8b1282a';
        deployer.deploy(ImpactMarket, cUSDAddress, [
            process.env.MARCO_MAINNET_WALLET_ADDRESS,
            process.env.AFONSO_MAINNET_WALLET_ADDRESS,
            process.env.BERNARDO_MAINNET_WALLET_ADDRESS,
        ], { from: accountDeploying});
        deployer.then(async () => {
            const impactMarket = await ImpactMarket.deployed();
            await deployer.deploy(CommunityFactory, cUSDAddress, impactMarket.address, { from: accountDeploying});
            const communityFactory = await CommunityFactory.deployed();
            await impactMarket.initCommunityFactory(communityFactory.address, { from: accountDeploying});
        });
    }
};
