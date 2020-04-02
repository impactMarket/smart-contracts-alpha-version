import { should } from 'chai';
import { ImpactMarketInstance } from '../types/truffle-contracts';
import BigNumber from 'bignumber.js';
const { expectRevert, time } = require('@openzeppelin/test-helpers');


const ImpactMarket = artifacts.require('./ImpactMarket.sol') as Truffle.Contract<ImpactMarketInstance>;
should();

/** @test {ImpactMarket} contract */
contract('ImpactMarket', (accounts) => {
    const adminAccount = accounts[0];
    const communityAccount = accounts[1];
    const userAccount = accounts[2];

    it('Test the flow', async () => {
        const impactMarketInstance = await ImpactMarket.deployed();

        await impactMarketInstance.addWhitelistCommunity(
            communityAccount,
            new BigNumber('2'),
            new BigNumber('86400'),
            new BigNumber('3600'),
            new BigNumber('1000'),
            { from: adminAccount },
        );
        await impactMarketInstance.addWhitelistUser(
            userAccount,
            { from: communityAccount },
        );

        (await impactMarketInstance.isWhitelistUser(userAccount)).should.be.true;
        (await impactMarketInstance.isWhitelistUserInCommunity(userAccount, communityAccount)).should.be.true;
        (await impactMarketInstance.cooldownClaim(userAccount)).toNumber().should.be.equal(0);
        const tx = await impactMarketInstance.claim({ from: userAccount });
        const blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
        (await impactMarketInstance.cooldownClaim(userAccount)).toNumber().should.be.equal(blockData.timestamp + 60);
        await expectRevert(
            impactMarketInstance.claim({ from: userAccount }),
            "Not allowed yet!"
        );
        await time.increase(time.duration.seconds(65));
        await impactMarketInstance.claim({ from: userAccount });
    });
});
