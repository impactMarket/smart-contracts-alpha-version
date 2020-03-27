import { should } from 'chai';
import { ImpaktMarketInstance } from '../types/truffle-contracts';
const { expectRevert, time } = require('@openzeppelin/test-helpers');


const ImpaktMarket = artifacts.require('./ImpaktMarket.sol') as Truffle.Contract<ImpaktMarketInstance>;
should();

/** @test {ImpaktMarket} contract */
contract('ImpaktMarket', (accounts) => {
    const adminAccount = accounts[0];
    const communityAccount = accounts[1];
    const userAccount = accounts[2];

    it('Test the flow', async () => {
        const impaktMarketInstance = await ImpaktMarket.deployed();

        await impaktMarketInstance.addWhitelistCommunity(communityAccount, { from: adminAccount });
        await impaktMarketInstance.addWhitelistUser(userAccount, { from: communityAccount });

        (await impaktMarketInstance.isWhitelistUser(userAccount)).should.be.true;
        (await impaktMarketInstance.cooldownClaim(userAccount)).toNumber().should.be.equal(0);
        const tx = await impaktMarketInstance.claim({ from: userAccount });
        const blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
        (await impaktMarketInstance.cooldownClaim(userAccount)).toNumber().should.be.equal(blockData.timestamp + 60);
        await expectRevert(
            impaktMarketInstance.claim({ from: userAccount }),
            "Not allowed yet!"
        );
        await time.increase(time.duration.seconds(65));
        await impaktMarketInstance.claim({ from: userAccount });
    });
});
