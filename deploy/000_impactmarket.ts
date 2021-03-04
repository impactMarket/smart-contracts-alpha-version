import 'dotenv/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { newKit } from '@celo/contractkit';
import IPCTJSON from '../artifacts/contracts/ubi/ImpactMarket.sol/ImpactMarket.json';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // Connect to the desired network
    // https://rc1-forno.celo-testnet.org
    // https://alfajores-forno.celo-testnet.org

    if (hre.network.name === 'alfajores') {
        console.log('deploying to alfajores');

        const cUSDAddress = process.env.CUSD_ALFAJORES_ADDRESS;
        const kit = newKit('https://alfajores-forno.celo-testnet.org');
        kit.addAccount(process.env.TESTNET_DEPLOY_PK!);

        // deploy impact market factory
        console.log('deploy ImpactMarket...');

        const impactMarketFactory = await hre.ethers.getContractFactory(
            'ImpactMarket'
        );
        const txIPCT = impactMarketFactory.getDeployTransaction(cUSDAddress, [
            process.env.BERNARDO_STAGING_WALLET_ADDRESS,
        ]);
        const resultIPCT = await kit.web3.eth.sendTransaction({
            from: (await kit.web3.eth.getAccounts())[0],
            data: txIPCT.data!.toString(),
        });

        // deploy community factory
        console.log('deploy CommunityFactory...');

        const communityFactoryFactory = await hre.ethers.getContractFactory(
            'CommunityFactory'
        );
        const txFactory = communityFactoryFactory.getDeployTransaction(
            cUSDAddress,
            resultIPCT.contractAddress
        );
        const resultFactory = await kit.web3.eth.sendTransaction({
            from: (await kit.web3.eth.getAccounts())[0],
            data: txFactory.data!.toString(),
        });

        // set impact market community factory
        console.log('set CommunityFactory...');

        const impactMarket = new kit.web3.eth.Contract(
            IPCTJSON.abi as any,
            resultIPCT.contractAddress!
        );

        await impactMarket.methods
            .initCommunityFactory(resultFactory.contractAddress!)
            .send({ from: (await kit.web3.eth.getAccounts())[0] });

        // success

        console.log({
            impactMarket: resultIPCT.contractAddress,
            communityFactory: resultFactory.contractAddress,
        });
    }
};
export default func;
