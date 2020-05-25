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
    const communityA = accounts[1];
    const communityB = accounts[2];
    const communityC = accounts[3];
    // beneficiaries
    const userA = accounts[4];
    const userB = accounts[5];
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let cUSDInstance: cUSDInstance;

    describe('Community - User', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2').multipliedBy(new BigNumber(10).pow(18)), // amount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000').multipliedBy(new BigNumber(10).pow(18)), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
        });

        it('should be able to add user to community', async () => {
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Valid);
        });

        it('should be able to lock user from community', async () => {
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Valid);
            await communityInstance.lockBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Locked);
        });

        it('should not be able to lock an invalid user from community', async () => {
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.NONE);
            await expectRevert(
                communityInstance.lockBeneficiary(userA, { from: communityA }),
                "NOT_YET"
            );
        });

        it('should be able to unlock locked user from community', async () => {
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Valid);
            await communityInstance.lockBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Locked);
            await communityInstance.unlockBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Valid);
        });

        it('should not be able to unlock a not locked user from community', async () => {
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Valid);
            await expectRevert(
                communityInstance.unlockBeneficiary(userA, { from: communityA }),
                "NOT_YET"
            );
        });

        it('should be able to remove user from community', async () => {
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.NONE);
            await communityInstance.addBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Valid);
            await communityInstance.removeBeneficiary(userA, { from: communityA });
            (await communityInstance.beneficiaries(userA)).toString().should.be.equal(BeneficiaryState.Removed);
        });
    });

    describe('Community - Claim', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2').multipliedBy(new BigNumber(10).pow(18)), // amount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('6').multipliedBy(new BigNumber(10).pow(18)), // claim hardcap
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
                "NOT_BENEFICIARY"
            );
        });

        it('should not claim after locked from community', async () => {
            await communityInstance.lockBeneficiary(userA, { from: communityA });
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "LOCKED"
            );
        });

        it('should not claim after removed from community', async () => {
            await communityInstance.removeBeneficiary(userA, { from: communityA });
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "REMOVED"
            );
        });

        it('should not claim without waiting', async () => {
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "NOT_YET"
            );
        });

        it('should not claim without waiting enough', async () => {
            await time.increase(time.duration.seconds(86400 + 5));
            await communityInstance.claim({ from: userA });
            await time.increase(time.duration.seconds(3600 + 5));
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "NOT_YET"
            );
            await time.increase(time.duration.seconds(3600 + 5));
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "NOT_YET"
            );
        });

        it('should claim after waiting', async () => {
            await time.increase(time.duration.seconds(86405));
            await communityInstance.claim({ from: userA });
            (await cUSDInstance.balanceOf(userA)).toString()
                .should.be.equal(new BigNumber(10).pow(18).multipliedBy(2).toString());
        });

        it('should not claim after max claim', async () => {
            await time.increase(time.duration.seconds(86400 + 5));
            await communityInstance.claim({ from: userA });
            await time.increase(time.duration.seconds(86400 + 3600 + 5));
            await communityInstance.claim({ from: userA });
            await time.increase(time.duration.seconds(86400 + 3600 + 3600 + 5));
            await communityInstance.claim({ from: userA });
            await time.increase(time.duration.seconds(86400 + 3600 + 3600 + 3600 + 5));
            await expectRevert(
                communityInstance.claim({ from: userA }),
                "MAX_CLAIM"
            );
        });
    });

    describe('Community - Governance', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2').multipliedBy(new BigNumber(10).pow(18)), // amount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000').multipliedBy(new BigNumber(10).pow(18)), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
        });

        it('should not be able to add coordinator to community if not coordinator', async () => {
            await expectRevert(
                communityInstance.addCoordinator(communityB, { from: communityC }),
                "NOT_COORDINATOR"
            );
        });

        it('should not be able to remove coordinator from community if not coordinator', async () => {
            await communityInstance.addCoordinator(communityB, { from: communityA });
            await expectRevert(
                communityInstance.removeCoordinator(communityB, { from: communityC }),
                "NOT_COORDINATOR"
            );
        });

        it('should be able to add coordinator to community if coordinator', async () => {
            await communityInstance.addCoordinator(communityB, { from: communityA });
        });

        it('should be able to remove coordinator to community if coordinator', async () => {
            await communityInstance.addCoordinator(communityB, { from: communityA });
            await communityInstance.removeCoordinator(communityB, { from: communityA });
        });
    });

    describe('ImpactMarket', () => {
        beforeEach(async () => {
            cUSDInstance = await cUSD.new();
            impactMarketInstance = await ImpactMarket.new(cUSDInstance.address);
        });

        it('should be able to add a community if admin', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2').multipliedBy(new BigNumber(10).pow(18)), // amount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000').multipliedBy(new BigNumber(10).pow(18)), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            communityInstance = await Community.at(communityAddress);
            (await communityInstance.amountByClaim()).toString().should.be.equal(
                new BigNumber('2').multipliedBy(new BigNumber(10).pow(18)).toString()
            );
            (await communityInstance.baseIntervalTime()).toString().should.be.equal('86400');
            (await communityInstance.incIntervalTime()).toString().should.be.equal('3600');
            (await communityInstance.claimHardCap()).toString().should.be.equal(
                new BigNumber('1000').multipliedBy(new BigNumber(10).pow(18)).toString()
            );

        });

        it('should be able to remove a community if admin', async () => {
            const tx = await impactMarketInstance.addCommunity(
                communityA,
                new BigNumber('2').multipliedBy(new BigNumber(10).pow(18)), // amount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000').multipliedBy(new BigNumber(10).pow(18)), // claim hardcap
                { from: adminAccount },
            );
            const communityAddress = tx.logs[0].args[0];
            await impactMarketInstance.removeCommunity(communityAddress, { from: adminAccount });
        });
    });

    describe('Chaos test (complete flow)', async () => {
        // add community
        const decimals = new BigNumber(10).pow(18);
        const addCommunity = async (communityManager: string): Promise<CommunityInstance> => {
            const tx = await impactMarketInstance.addCommunity(
                communityManager,
                new BigNumber('2').multipliedBy(decimals), // amount by claim
                new BigNumber('86400'), // base interval time in ms
                new BigNumber('3600'), // increment interval time in ms
                new BigNumber('1000').multipliedBy(decimals), // claim hardcap
                { from: adminAccount },
            );
            // eslint-disable-next-line prefer-const
            const communityAddress = tx.logs[0].args[0] as string;
            const instance = await Community.at(communityAddress);
            await cUSDInstance.testFakeFundAddress(communityAddress, { from: adminAccount });
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
            const communityInstance = await addCommunity(communityA);
            await addBeneficiary(communityInstance, userA, communityA);
            await waitClaimTime(communityInstance, userA);
            await beneficiaryClaim(communityInstance, userA);
            await expectRevert(
                beneficiaryClaim(communityInstance, userA),
                "NOT_YET"
            );
            await waitClaimTime(communityInstance, userA);
            await beneficiaryClaim(communityInstance, userA);
        });

        it('many beneficiaries to one community', async () => {
            //
        });

        it('many beneficiaries to many communities', async () => {
            //
        });
    });
});