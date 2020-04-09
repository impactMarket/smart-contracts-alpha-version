import { should } from 'chai';
import { ImpactMarketInstance, CommunityInstance, cUSDInstance } from '../types/truffle-contracts';
import BigNumber from 'bignumber.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, time } = require('@openzeppelin/test-helpers');


const ImpactMarket = artifacts.require('./ImpactMarket.sol') as Truffle.Contract<ImpactMarketInstance>;
const Community = artifacts.require('./Community.sol') as Truffle.Contract<CommunityInstance>;
const cUSD = artifacts.require('./test/cUSD.sol') as Truffle.Contract<cUSDInstance>;
should();


/** @test {ImpactMarket} contract */
contract('ImpactMarket', async (accounts) => {
    const adminAccount = accounts[0];
    const communityA = accounts[1];
    const userA = accounts[2];
    const userB = accounts[3];
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let cUSDInstance: cUSDInstance;

    describe('Community', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
        });

        it('should add a community', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
            (await communityInstance.amountByClaim()).toString().should.be.equal('2');
            (await communityInstance.baseIntervalTime()).toString().should.be.equal('86400');
            (await communityInstance.incIntervalTime()).toString().should.be.equal('3600');
            (await communityInstance.claimHardCap()).toString().should.be.equal('1000');

        });

        it('should remove a community', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            await impactMarketInstance.removeCommunity(communityAddress, { from: adminAccount });
        });

        it('should add user to community', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
            (await communityInstance.beneficiaries(userA)).should.be.false;
            await communityInstance.addBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).should.be.true;
        });

        it('should remove user from community', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
            (await communityInstance.beneficiaries(userA)).should.be.false;
            await communityInstance.addBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).should.be.true;
            await communityInstance.removeBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).should.be.false;
        });
    });

    describe('ImpactMarket', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
            await cUSDInstance.testFakeFundAddress(communityAddress, { from: adminAccount });
            await communityInstance.addBeneficiary(userA, { from: communityA });
        });

        it('should not claim without belong to community', async () => {
            await expectRevert(
                communityInstance.claim({ from: userB }),
                "Not a beneficiary!"
            );
        });

        it('should not claim without waiting', async () => {
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "Not allowed yet!"
            );
        });

        it('should claim after waiting', async () => {
            await time.increase(time.duration.seconds(86405));
            await communityInstance.claim({ from: userA });
            (await cUSDInstance.balanceOf(userA)).toString()
                .should.be.equal(new BigNumber(10).pow(18).multipliedBy(2).toString());
        });
    });

    describe('Test complete flow', async () => {
        it('one user to one community', async () => {
            let tx;
            let blockData;
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2'), // ammount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000'), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
            await cUSDInstance.testFakeFundAddress(communityAddress, { from: adminAccount });
            tx = await communityInstance.addBeneficiary(
                userA,
                { from: communityA },
            );
            blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
            (await communityInstance.beneficiaries(userA)).should.be.true;
            (await communityInstance.cooldownClaim(userA)).toNumber().should.be.equal(blockData.timestamp + 86400);

            await time.increase(time.duration.seconds(86405)); // base interval + 5
            tx = await communityInstance.claim({ from: userA });
            (await cUSDInstance.balanceOf(userA)).toString()
                .should.be.equal(new BigNumber(10).pow(18).multipliedBy(2).toString());

            blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
            (await communityInstance.cooldownClaim(userA)).toNumber().should.be.equal(blockData.timestamp + 3600);
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "Not allowed yet!"
            );

            await time.increase(time.duration.seconds(3605)); // increment interval + 5
            await communityInstance.claim({ from: userA });
            (await cUSDInstance.balanceOf(userA)).toString()
                .should.be.equal(new BigNumber(10).pow(18).multipliedBy(4).toString());
        });
    });
});