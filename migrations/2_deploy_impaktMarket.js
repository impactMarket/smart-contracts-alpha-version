var ImpaktMarket = artifacts.require('ImpaktMarket')

module.exports = async (deployer) => {
    await deployer.deploy(ImpaktMarket);
}