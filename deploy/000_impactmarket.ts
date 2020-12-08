import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, execute, read, log } = deployments;

    await deploy('ImpactMarket', {
        from: '0xa8B9a7B29C11A6D8CBFe1e8aB5E16E81Ec50980f',
        args: ['0x874069fa1eb16d44d622f2e0ca25eea172369bc1', ['0x833961aab38d24EECdCD2129Aa5a5d41Fd86Acbf']],
        log: true,
        deterministicDeployment: true,
    });
};
export default func;