var ImpactMarket = artifacts.require('ImpactMarket')

module.exports = deployer => {
  deployer.deploy(ImpactMarket, '0xC612D5449ec3422bDa1e4E55A946495a661cbd4d'); // set cUSD address
};
