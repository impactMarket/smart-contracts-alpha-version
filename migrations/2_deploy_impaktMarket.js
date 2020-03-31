var ImpactMarket = artifacts.require('ImpactMarket')

module.exports = async (deployer) => {
    await deployer.deploy(ImpactMarket);
}