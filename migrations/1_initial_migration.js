const Migrations = artifacts.require("Migrations");

module.exports = (deployer, network, accounts) => {
  if (network === 'alfajores' || network === 'mainnet') {
    return;
  }
  deployer.deploy(Migrations);
};
