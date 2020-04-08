import { should } from 'chai';
import { ImpactMarketInstance, cUSDInstance } from '../types/truffle-contracts';
import BigNumber from 'bignumber.js';
const { expectRevert, time } = require('@openzeppelin/test-helpers');


const ImpactMarket = artifacts.require('./ImpactMarket.sol') as Truffle.Contract<ImpactMarketInstance>;
const cUSD = artifacts.require('./test/cUSD.sol') as Truffle.Contract<cUSDInstance>;
should();

/** @test {ImpactMarket} contract */
contract('ImpactMarket', async (accounts) => {
    const adminAccount = accounts[0];
    const communityA = accounts[1];
    const userA = accounts[2];
    const userB = accounts[3];
    let impactMarketInstance: ImpactMarketInstance;
    let cUSDInstance: cUSDInstance;

    describe('WhitelistedCommunity', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
        });

        it('should not be a whitelisted community by default', async () => {
            (await impactMarketInstance.isWhitelistCommunity(communityA)).should.be.false;
        });

        it('should not be in any community by default', async () => {
            (await impactMarketInstance.isUserInAnyCommunity(userA)).should.be.false;
        });

        it('should not be in a community by default', async () => {
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.false;
        });

        it('should not be a community by default', async () => {
            const community = objectifyCommunityClaim(await impactMarketInstance.commnitiesClaim(communityA));
            community.amountByClaim.toString().should.be.equal('0');
            community.baseIntervalTime.toString().should.be.equal('0');
            community.incIntervalTime.toString().should.be.equal('0');
            community.claimHardCap.toString().should.be.equal('0');
        });

        it('should add a community', async () => {
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            const community = objectifyCommunityClaim(await impactMarketInstance.commnitiesClaim(communityA));
            community.amountByClaim.toString().should.be.equal('2');
            community.baseIntervalTime.toString().should.be.equal('86400');
            community.incIntervalTime.toString().should.be.equal('3600');
            community.claimHardCap.toString().should.be.equal('1000');

        });

        it('should renounce from community', async () => {
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            await impactMarketInstance.renounceWhitelistCommunity({ from: communityA });
        });

        it('should remove a community', async () => {
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            await impactMarketInstance.removeWhitelistCommunity(communityA, { from: adminAccount });
        });

        it('should add user to community', async () => {
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.false;
            await impactMarketInstance.addUser(userA, { from: communityA });
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.true;
        });

        it('should remove user from community', async () => {
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.false;
            await impactMarketInstance.addUser(userA, { from: communityA });
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.true;
            await impactMarketInstance.removeUser(userA, { from: communityA });
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.false;
        });

        it('should renounce from community', async () => {
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.false;
            await impactMarketInstance.addUser(userA, { from: communityA });
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.true;
            await impactMarketInstance.renounce({ from: userA });
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.false;
        });
    });

    describe('ImpactMarket', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            await cUSDInstance.testFakeFundAddress(communityA, { from: adminAccount });
            await impactMarketInstance.addUser(userA, { from: communityA });
        });

        it('should not claim without belong to community', async () => {
            await expectRevert(
                impactMarketInstance.claim({ from: userB }),
                "Not in a community!"
            );
        });

        it('should not claim without waiting', async () => {
            await expectRevert(
                impactMarketInstance.claim({ from: userA }),
                "Not allowed yet!"
            );
        });

        it('should claim after waiting', async () => {
            await time.increase(time.duration.seconds(86405));
            await impactMarketInstance.claim({ from: userA });
            // (await cUSDInstance.balanceOf(userA)).toString().should.be.equal(new BigNumber(10).pow(18).multipliedBy(2));
        });
    });

    describe('Test complete flow', async () => {
        it('one user to one community', async () => {
            let tx;
            let blockData;
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            await impactMarketInstance.addWhitelistCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            await cUSDInstance.testFakeFundAddress(communityA, { from: adminAccount });
            tx = await impactMarketInstance.addUser(
                userA,
                { from: communityA },
            );
            blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
            (await impactMarketInstance.isUserInAnyCommunity(userA)).should.be.true;
            (await impactMarketInstance.isUserInCommunity(userA, communityA)).should.be.true;
            (await impactMarketInstance.cooldownClaim(userA)).toNumber().should.be.equal(blockData.timestamp + 86400);

            await time.increase(time.duration.seconds(86405)); // base interval + 5
            tx = await impactMarketInstance.claim({ from: userA });
            blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
            (await impactMarketInstance.cooldownClaim(userA)).toNumber().should.be.equal(blockData.timestamp + 3600);
            await expectRevert(
                impactMarketInstance.claim({ from: userA }),
                "Not allowed yet!"
            );

            await time.increase(time.duration.seconds(3605)); // increment interval + 5
            await impactMarketInstance.claim({ from: userA });
            // (await cUSDInstance.balanceOf(userA)).toString().should.be.equal(new BigNumber(10).pow(18).multipliedBy(2));
        });
    });
});

function objectifyCommunityClaim(community: [BigNumber, BigNumber, BigNumber, BigNumber]) {
    return {
        amountByClaim: community[0],
        baseIntervalTime: community[1],
        incIntervalTime: community[2],
        claimHardCap: community[3],
    }
}