import { should } from 'chai';
import { ImpactMarketInstance, CommunityInstance, cUSDInstance } from '../types/truffle-contracts';
import BigNumber from 'bignumber.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, time } = require('@openzeppelin/test-helpers');


const ImpactMarket = artifacts.require('./ImpactMarket.sol') as Truffle.Contract<ImpactMarketInstance>;
const Community = artifacts.require('./Community.sol') as Truffle.Contract<CommunityInstance>;
const cUSD = artifacts.require('./test/cUSD.sol') as Truffle.Contract<cUSDInstance>;
should();
enum BeneficiaryState {
    NONE = '0',
    Valid = '1',
    Locked = '2',
    Removed = '3',
}


BigNumber.config({ EXPONENTIAL_AT: 25 })
/** @test {ImpactMarket} contract */
contract('ImpactMarket', async (accounts) => {
    const adminAccount = accounts[0];
    // community managers
    const communityManagerA = accounts[1];
    const communityManagerB = accounts[2];
    const communityManagerC = accounts[3];
    // beneficiaries
    const beneficiaryA = accounts[4];
    const beneficiaryB = accounts[5];
    const beneficiaryC = accounts[6];
    const beneficiaryD = accounts[7];
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let cUSDInstance: cUSDInstance;
    // constants
    const decimals = new BigNumber(10).pow(18);
    const hour = time.duration.hours(1);
    const day = time.duration.days(1);
    const week = time.duration.weeks(1);
    const month = time.duration.days(30);
    const claimAmountTwo = new BigNumber('2').multipliedBy(decimals);
    const maxClaimTen = new BigNumber('10').multipliedBy(decimals);

    describe('Community - Beneficiary', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            const tx = await impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo,
                day,
                hour,
                maxClaimTen,
                { from: adminAccount },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            communityInstance = await Community.at(communityManagerAddress);
        });

        it('should be able to add beneficiary to community', async () => {
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
        });

        it('should be able to lock beneficiary from community', async () => {
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
            await communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Locked);
        });

        it('should not be able to lock an invalid beneficiary from community', async () => {
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
            await expectRevert(
                communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA }),
                "NOT_YET"
            );
        });

        it('should be able to unlock locked beneficiary from community', async () => {
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
            await communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Locked);
            await communityInstance.unlockBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
        });

        it('should not be able to unlock a not locked beneficiary from community', async () => {
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
            await expectRevert(
                communityInstance.unlockBeneficiary(beneficiaryA, { from: communityManagerA }),
                "NOT_YET"
            );
        });

        it('should be able to remove beneficiary from community', async () => {
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
            await communityInstance.removeBeneficiary(beneficiaryA, { from: communityManagerA });
            (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Removed);
        });
    });

    describe('Community - Claim', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            const tx = await impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo,
                day,
                hour,
                maxClaimTen,
                { from: adminAccount },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            communityInstance = await Community.at(communityManagerAddress);
            await cUSDInstance.testFakeFundAddress(communityManagerAddress, { from: adminAccount });
            await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
        });

        it('should not claim without belong to community', async () => {
            await expectRevert(
                communityInstance.claim({ from: beneficiaryB }),
                "NOT_BENEFICIARY"
            );
        });

        it('should not claim after locked from community', async () => {
            await communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA });
            await expectRevert(
                communityInstance.claim({ from: beneficiaryA }),
                "LOCKED"
            );
        });

        it('should not claim after removed from community', async () => {
            await communityInstance.removeBeneficiary(beneficiaryA, { from: communityManagerA });
            await expectRevert(
                communityInstance.claim({ from: beneficiaryA }),
                "REMOVED"
            );
        });

        it('should not claim without waiting', async () => {
            await expectRevert(
                communityInstance.claim({ from: beneficiaryA }),
                "NOT_YET"
            );
        });

        it('should not claim without waiting enough', async () => {
            const baseInterval = (await communityInstance.baseIntervalTime()).toNumber();
            const incrementalInterval = (await communityInstance.incIntervalTime()).toNumber();
            await time.increase(time.duration.seconds(baseInterval + 5));
            await communityInstance.claim({ from: beneficiaryA });
            await time.increase(time.duration.seconds(incrementalInterval + 5));
            await expectRevert(
                communityInstance.claim({ from: beneficiaryA }),
                "NOT_YET"
            );
            await time.increase(time.duration.seconds(incrementalInterval + 5));
            await expectRevert(
                communityInstance.claim({ from: beneficiaryA }),
                "NOT_YET"
            );
        });

        it('should claim after waiting', async () => {
            const baseInterval = (await communityInstance.baseIntervalTime()).toNumber();
            await time.increase(time.duration.seconds(baseInterval + 5));
            await communityInstance.claim({ from: beneficiaryA });
            (await cUSDInstance.balanceOf(beneficiaryA)).toString()
                .should.be.equal(claimAmountTwo.toString());
        });

        it('should not claim after max claim', async () => {
            const baseInterval = (await communityInstance.baseIntervalTime()).toNumber();
            const incrementalInterval = (await communityInstance.incIntervalTime()).toNumber();
            const claimAmount = new BigNumber((await communityInstance.amountByClaim()).toString()).div(decimals).toNumber();
            const maxClaimAmount = new BigNumber((await communityInstance.claimHardCap()).toString()).div(decimals).toNumber();
            for (let index = 0; index < maxClaimAmount / claimAmount; index++) {
                await time.increase(time.duration.seconds(baseInterval + incrementalInterval * index + 5));
                await communityInstance.claim({ from: beneficiaryA });
            }
            await time.increase(time.duration.seconds(baseInterval + incrementalInterval * (maxClaimAmount / claimAmount) + 5));
            await expectRevert(
                communityInstance.claim({ from: beneficiaryA }),
                "MAX_CLAIM"
            );
        });
    });

    describe('Community - Governance', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            const tx = await impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo,
                day,
                hour,
                maxClaimTen,
                { from: adminAccount },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            communityInstance = await Community.at(communityManagerAddress);
        });

        it('should not be able to add coordinator to community if not coordinator', async () => {
            await expectRevert(
                communityInstance.addCoordinator(communityManagerB, { from: communityManagerC }),
                "NOT_COORDINATOR"
            );
        });

        it('should not be able to remove coordinator from community if not coordinator', async () => {
            await communityInstance.addCoordinator(communityManagerB, { from: communityManagerA });
            await expectRevert(
                communityInstance.removeCoordinator(communityManagerB, { from: communityManagerC }),
                "NOT_COORDINATOR"
            );
        });

        it('should be able to add coordinator to community if coordinator', async () => {
            await communityInstance.addCoordinator(communityManagerB, { from: communityManagerA });
        });

        it('should be able to remove coordinator to community if coordinator', async () => {
            await communityInstance.addCoordinator(communityManagerB, { from: communityManagerA });
            await communityInstance.removeCoordinator(communityManagerB, { from: communityManagerA });
        });
    });

    describe('ImpactMarket', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
        });

        it('should be able to add a community if admin', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo,
                day,
                hour,
                maxClaimTen,
                { from: adminAccount },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            communityInstance = await Community.at(communityManagerAddress);
            (await communityInstance.amountByClaim()).toString().should.be.equal(
                claimAmountTwo.toString()
            );
            (await communityInstance.baseIntervalTime()).toString().should.be.equal('86400');
            (await communityInstance.incIntervalTime()).toString().should.be.equal('3600');
            (await communityInstance.claimHardCap()).toString().should.be.equal(
                maxClaimTen.toString()
            );

        });

        it('should be able to remove a community if admin', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo,
                day,
                hour,
                maxClaimTen,
                { from: adminAccount },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            await impactMarketInstance.removeCommunity(communityManagerAddress, { from: adminAccount });
        });
    });

    describe('Chaos test (complete flow)', async () => {
        // add community
        const addCommunity = async (communityManager: string): Promise<CommunityInstance> => {
            const tx = await impactMarketInstance.addCommunity(
                communityManager,
                claimAmountTwo,
                day,
                hour,
                maxClaimTen,
                { from: adminAccount },
            );
            // eslint-disable-next-line prefer-const
            const communityManagerAddress = tx.logs[1].args[0] as string;
            const instance = await Community.at(communityManagerAddress);
            await cUSDInstance.testFakeFundAddress(communityManagerAddress, { from: adminAccount });
            return instance;
        }
        // add beneficiary
        const addBeneficiary = async (instance: CommunityInstance, beneficiaryAddress: string, communityManagerAddress: string): Promise<void> => {
            const tx = await instance.addBeneficiary(
                beneficiaryAddress,
                { from: communityManagerAddress },
            );
            const blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
            (await instance.beneficiaries(beneficiaryAddress)).toString().should.be.equal(BeneficiaryState.Valid);
            (await instance.cooldown(beneficiaryAddress)).toNumber().should.be.equal(blockData.timestamp + 86400);
        }
        // wait claim time
        const waitClaimTime = async (instance: CommunityInstance, beneficiaryAddress: string): Promise<void> => {
            const waitIs = (await instance.lastInterval(beneficiaryAddress)).toNumber();
            await time.increase(time.duration.seconds(waitIs + 5)); // wait is + 5
        }
        // claim
        const beneficiaryClaim = async (instance: CommunityInstance, beneficiaryAddress: string): Promise<void> => {
            const previousBalance = new BigNumber(await cUSDInstance.balanceOf(beneficiaryAddress));
            const previousLastInterval = new BigNumber(await instance.lastInterval(beneficiaryAddress));
            await instance.claim({ from: beneficiaryAddress });
            const currentBalance = new BigNumber(await cUSDInstance.balanceOf(beneficiaryAddress));
            const currentLastInterval = new BigNumber(await instance.lastInterval(beneficiaryAddress));
            previousBalance.plus(await instance.amountByClaim()).toString()
                .should.be.equal(currentBalance.toString());
            previousLastInterval.plus(await instance.incIntervalTime()).toString()
                .should.be.equal(currentLastInterval.toString());
        }

        //
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
        });
        it('one beneficiary to one community', async () => {
            const communityInstance = await addCommunity(communityManagerA);
            await addBeneficiary(communityInstance, beneficiaryA, communityManagerA);
            await waitClaimTime(communityInstance, beneficiaryA);
            await beneficiaryClaim(communityInstance, beneficiaryA);
            await expectRevert(
                beneficiaryClaim(communityInstance, beneficiaryA),
                "NOT_YET"
            );
            await waitClaimTime(communityInstance, beneficiaryA);
            await beneficiaryClaim(communityInstance, beneficiaryA);
        });

        it('many beneficiaries to one community', async () => {
            const communityInstance = await addCommunity(communityManagerA);
            const previousCommunityBalance = new BigNumber((await cUSDInstance.balanceOf(communityInstance.address)).toString());
            await addBeneficiary(communityInstance, beneficiaryA, communityManagerA);
            await addBeneficiary(communityInstance, beneficiaryB, communityManagerA);
            await addBeneficiary(communityInstance, beneficiaryC, communityManagerA);
            await addBeneficiary(communityInstance, beneficiaryD, communityManagerA);
            // beneficiary A claims twice
            await waitClaimTime(communityInstance, beneficiaryA);
            await beneficiaryClaim(communityInstance, beneficiaryA);
            await waitClaimTime(communityInstance, beneficiaryA);
            await beneficiaryClaim(communityInstance, beneficiaryA);
            // beneficiary B claims once
            await waitClaimTime(communityInstance, beneficiaryB);
            await beneficiaryClaim(communityInstance, beneficiaryB);
            // beneficiary C claims it all
            const claimAmount = new BigNumber((await communityInstance.amountByClaim()).toString()).div(decimals).toNumber();
            const maxClaimAmount = new BigNumber((await communityInstance.claimHardCap()).toString()).div(decimals).toNumber();
            const maxClaimsPerUser = maxClaimAmount / claimAmount;
            for (let index = 0; index < maxClaimsPerUser; index++) {
                await waitClaimTime(communityInstance, beneficiaryC);
                await beneficiaryClaim(communityInstance, beneficiaryC);
            }
            // beneficiary B can still claim
            await waitClaimTime(communityInstance, beneficiaryB);
            await beneficiaryClaim(communityInstance, beneficiaryB);
            // beneficiary A can still claim
            await waitClaimTime(communityInstance, beneficiaryA);
            await beneficiaryClaim(communityInstance, beneficiaryA);
            // beneficiary C can't claim anymore
            await waitClaimTime(communityInstance, beneficiaryC);
            await expectRevert(
                beneficiaryClaim(communityInstance, beneficiaryC),
                "MAX_CLAIM"
            );
            const currentCommunityBalance = new BigNumber((await cUSDInstance.balanceOf(communityInstance.address)).toString());
            previousCommunityBalance.minus(currentCommunityBalance).toString().should.be
                .equal(new BigNumber(claimAmount * (5 + maxClaimsPerUser)).multipliedBy(decimals).toString());
        });

        it('many beneficiaries to many communities', async () => {
            //
        });
    });
});