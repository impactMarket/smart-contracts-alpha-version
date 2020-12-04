import { task, HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
// import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "hardhat-typechain";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more



const config: HardhatUserConfig = {
  // Your type-safe config goes here
  solidity: "0.6.5",
  typechain: {
    outDir: "types/",
    target: "ethers-v5",
  },
  mocha: {
    timeout: 20000
  }
};

export default config;