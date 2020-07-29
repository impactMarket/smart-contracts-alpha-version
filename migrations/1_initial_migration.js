const Migrations = artifacts.require("Migrations");

module.exports = (deployer, network, accounts) => {
  if (network === 'alfajores') {
    return;
  }
  deployer.deploy(Migrations);
};
