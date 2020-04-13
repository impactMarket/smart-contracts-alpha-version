const ImpactMarket = artifacts.require("ImpactMarket");

module.exports = deployer => {
  const cUSDAddress = '0xa561131a1C8aC25925FB848bCa45A74aF61e5A38';
  deployer.deploy(ImpactMarket, cUSDAddress);
};
