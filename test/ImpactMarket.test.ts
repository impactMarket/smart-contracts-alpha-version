import { should } from 'chai';
import { ImpactMarketInstance, CommunityInstance, cUSDInstance } from '../types/truffle-contracts';
import BigNumber from 'bignumber.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');


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
    const adminAccount1 = accounts[0];
    const adminAccount2 = accounts[1];
    // community managers
    const communityManagerA = accounts[2];
    const communityManagerB = accounts[3];
    const communityManagerC = accounts[4];
    // beneficiaries
    const beneficiaryA = accounts[5];
    const beneficiaryB = accounts[6];
    const beneficiaryC = accounts[7];
    const beneficiaryD = accounts[8];
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let cUSDInstance: cUSDInstance;
    // constants
    const decimals = new BigNumber(10).pow(18);
    const hour = time.duration.hours(1);
    const day = time.duration.days(1);
    const week = time.duration.weeks(1);
    // const month = time.duration.days(30);
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
                { from: adminAccount1 },
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
                { from: adminAccount1 },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            communityInstance = await Community.at(communityManagerAddress);
            await cUSDInstance.testFakeFundAddress(communityManagerAddress, { from: adminAccount1 });
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

        it('should not claim if community is locked', async () => {
            const receipt = await communityInstance.lock({ from: communityManagerA });
            expectEvent(receipt, 'CommunityLocked', {
                _by: communityManagerA,
            });
            await expectRevert(
                communityInstance.claim({ from: beneficiaryA }),
                "LOCKED"
            );
        });

        it('should not claim without waiting enough', async () => {
            const baseInterval = (await communityInstance.baseIntervalTime()).toNumber();
            const incrementalInterval = (await communityInstance.incIntervalTime()).toNumber();
            await communityInstance.claim({ from: beneficiaryA });
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
            await communityInstance.claim({ from: beneficiaryA });
            for (let index = 0; index < (maxClaimAmount / claimAmount) - 1; index++) {
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
                { from: adminAccount1 },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            communityInstance = await Community.at(communityManagerAddress);
        });

        it('should be able to migrate funds from community if coordinator', async () => {
            const newTx = await impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo,
                day,
                hour,
                maxClaimTen,
                { from: adminAccount1 },
            );
            const newCommunityAddress = newTx.logs[1].args[0];
            await communityInstance.migrateFunds(newCommunityAddress, { from: communityManagerA });
        });

        it('should be able edit community if coordinator', async () => {
            (await communityInstance.incIntervalTime()).toString().should.be.equal(hour.toString());
            await communityInstance.edit(
                claimAmountTwo,
                week,
                day,
                maxClaimTen,
                cUSDInstance.address,
                { from: communityManagerA }
            );
            (await communityInstance.incIntervalTime()).toString().should.be.equal(day.toString());
        });

        it('should not be able edit community if not coordinator', async () => {
            await expectRevert(
                communityInstance.edit(
                    claimAmountTwo,
                    day,
                    day,
                    maxClaimTen,
                    cUSDInstance.address,
                    { from: communityManagerB }
                ),
                "NOT_COORDINATOR"
            );
        });

        it('should not be able edit community with invalid values', async () => {
            await expectRevert.unspecified(
                communityInstance.edit(
                    claimAmountTwo,
                    day,
                    week,
                    maxClaimTen,
                    cUSDInstance.address,
                    { from: communityManagerA }
                )
            );
            await expectRevert.unspecified(
                communityInstance.edit(
                    maxClaimTen, // supposed to be wrong
                    week,
                    day,
                    claimAmountTwo,
                    cUSDInstance.address,
                    { from: communityManagerA }
                )
            );
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

        it('should be able to renounce from coordinator of community if coordinator', async () => {
            await communityInstance.addCoordinator(communityManagerB, { from: communityManagerA });
            await communityInstance.renounceRole(
                await communityInstance.COORDINATOR_ROLE(),
                communityManagerB, { from: communityManagerB }
            );
        });

        it('should be able to lock community if coordinator', async () => {
            const receipt = await communityInstance.lock({ from: communityManagerA });
            expectEvent(receipt, 'CommunityLocked', {
                _by: communityManagerA,
            });
        });

        it('should be able to lock community if coordinator', async () => {
            let receipt = await communityInstance.lock({ from: communityManagerA });
            expectEvent(receipt, 'CommunityLocked', {
                _by: communityManagerA,
            });
            receipt = await communityInstance.unlock({ from: communityManagerA });
            expectEvent(receipt, 'CommunityUnlocked', {
                _by: communityManagerA,
            });
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
                { from: adminAccount1 },
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
                { from: adminAccount1 },
            );
            const communityManagerAddress = tx.logs[1].args[0];
            await impactMarketInstance.removeCommunity(communityManagerAddress, { from: adminAccount1 });
        });

        it('should be able to add admin', async () => {
            const receipt = await impactMarketInstance.addAdmin(adminAccount2, { from: adminAccount1 });
            expectEvent(receipt, 'RoleGranted', {
                role: await impactMarketInstance.ADMIN_ROLE(),
                account: adminAccount2,
                sender: adminAccount1,
            });
        });

        it('should be able to remove admin', async () => {
            await impactMarketInstance.addAdmin(adminAccount2, { from: adminAccount1 });
            const receipt = await impactMarketInstance.removeAdmin(adminAccount2, { from: adminAccount1 });
            expectEvent(receipt, 'RoleRevoked', {
                role: await impactMarketInstance.ADMIN_ROLE(),
                account: adminAccount2,
                sender: adminAccount1,
            });
        });

        it('should not be able to add admin if not admin', async () => {
            await expectRevert(
                impactMarketInstance.addAdmin(adminAccount2, { from: adminAccount2 }),
                'NOT_ADMIN'
            );
        });

        it('should not be able to create a community with invalid values', async () => {
            await expectRevert.unspecified(
                impactMarketInstance.addCommunity(
                    communityManagerA,
                    claimAmountTwo,
                    hour,
                    day,
                    maxClaimTen,
                    { from: adminAccount1 },
                )
            );
            await expectRevert.unspecified(
                impactMarketInstance.addCommunity(
                    communityManagerA,
                    maxClaimTen, // it's supposed to be wrong!
                    day,
                    hour,
                    claimAmountTwo,
                    { from: adminAccount1 },
                )
            );
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
                { from: adminAccount1 },
            );
            // eslint-disable-next-line prefer-const
            const communityManagerAddress = tx.logs[1].args[0] as string;
            const instance = await Community.at(communityManagerAddress);
            await cUSDInstance.testFakeFundAddress(communityManagerAddress, { from: adminAccount1 });
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
            (await instance.cooldown(beneficiaryAddress)).toNumber().should.be.equal(blockData.timestamp);
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
            const communityInstanceA = await addCommunity(communityManagerA);
            await addBeneficiary(communityInstanceA, beneficiaryA, communityManagerA);
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
            await expectRevert(
                beneficiaryClaim(communityInstanceA, beneficiaryA),
                "NOT_YET"
            );
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
        });

        it('many beneficiaries to one community', async () => {
            const communityInstanceA = await addCommunity(communityManagerA);
            const previousCommunityBalance = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
            await addBeneficiary(communityInstanceA, beneficiaryA, communityManagerA);
            await addBeneficiary(communityInstanceA, beneficiaryB, communityManagerA);
            await addBeneficiary(communityInstanceA, beneficiaryC, communityManagerA);
            await addBeneficiary(communityInstanceA, beneficiaryD, communityManagerA);
            // beneficiary A claims twice
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
            // beneficiary B claims once
            await waitClaimTime(communityInstanceA, beneficiaryB);
            await beneficiaryClaim(communityInstanceA, beneficiaryB);
            // beneficiary C claims it all
            const claimAmount = new BigNumber((await communityInstanceA.amountByClaim()).toString()).div(decimals).toNumber();
            const maxClaimAmount = new BigNumber((await communityInstanceA.claimHardCap()).toString()).div(decimals).toNumber();
            const maxClaimsPerUser = maxClaimAmount / claimAmount;
            for (let index = 0; index < maxClaimsPerUser; index++) {
                await waitClaimTime(communityInstanceA, beneficiaryC);
                await beneficiaryClaim(communityInstanceA, beneficiaryC);
            }
            // beneficiary B can still claim
            await waitClaimTime(communityInstanceA, beneficiaryB);
            await beneficiaryClaim(communityInstanceA, beneficiaryB);
            // beneficiary A can still claim
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
            // beneficiary C can't claim anymore
            await waitClaimTime(communityInstanceA, beneficiaryC);
            await expectRevert(
                beneficiaryClaim(communityInstanceA, beneficiaryC),
                "MAX_CLAIM"
            );
            const currentCommunityBalance = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
            previousCommunityBalance.minus(currentCommunityBalance).toString().should.be
                .equal(new BigNumber(claimAmount * (5 + maxClaimsPerUser)).multipliedBy(decimals).toString());
        });

        it('many beneficiaries to many communities', async () => {
            // community A
            const communityInstanceA = await addCommunity(communityManagerA);
            const communityInstanceB = await addCommunity(communityManagerB);
            const previousCommunityBalanceA = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
            const previousCommunityBalanceB = new BigNumber((await cUSDInstance.balanceOf(communityInstanceB.address)).toString());
            //
            await addBeneficiary(communityInstanceA, beneficiaryA, communityManagerA);
            await addBeneficiary(communityInstanceA, beneficiaryB, communityManagerA);
            //
            await addBeneficiary(communityInstanceB, beneficiaryC, communityManagerB);
            await addBeneficiary(communityInstanceB, beneficiaryD, communityManagerB);
            // beneficiary A claims twice
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
            // beneficiary B claims it all
            const claimAmountA = new BigNumber((await communityInstanceA.amountByClaim()).toString()).div(decimals).toNumber();
            const maxClaimAmountA = new BigNumber((await communityInstanceA.claimHardCap()).toString()).div(decimals).toNumber();
            const maxClaimsPerUserA = maxClaimAmountA / claimAmountA;
            for (let index = 0; index < maxClaimsPerUserA; index++) {
                await waitClaimTime(communityInstanceA, beneficiaryB);
                await beneficiaryClaim(communityInstanceA, beneficiaryB);
            }
            // beneficiary C claims it all
            const claimAmountB = new BigNumber((await communityInstanceB.amountByClaim()).toString()).div(decimals).toNumber();
            const maxClaimAmountB = new BigNumber((await communityInstanceB.claimHardCap()).toString()).div(decimals).toNumber();
            const maxClaimsPerUserB = maxClaimAmountB / claimAmountB;
            for (let index = 0; index < maxClaimsPerUserB; index++) {
                await waitClaimTime(communityInstanceB, beneficiaryC);
                await beneficiaryClaim(communityInstanceB, beneficiaryC);
            }
            // beneficiary D claims three times
            await waitClaimTime(communityInstanceB, beneficiaryD);
            await beneficiaryClaim(communityInstanceB, beneficiaryD);
            await waitClaimTime(communityInstanceB, beneficiaryD);
            await beneficiaryClaim(communityInstanceB, beneficiaryD);
            await waitClaimTime(communityInstanceB, beneficiaryD);
            await beneficiaryClaim(communityInstanceB, beneficiaryD);
            // beneficiary A can still claim
            await waitClaimTime(communityInstanceA, beneficiaryA);
            await beneficiaryClaim(communityInstanceA, beneficiaryA);
            // beneficiary C can't claim anymore
            await waitClaimTime(communityInstanceB, beneficiaryC);
            await expectRevert(
                beneficiaryClaim(communityInstanceB, beneficiaryC),
                "MAX_CLAIM"
            );
            // beneficiary B can't claim anymore
            await waitClaimTime(communityInstanceB, beneficiaryC);
            await expectRevert(
                beneficiaryClaim(communityInstanceB, beneficiaryC),
                "MAX_CLAIM"
            );
            // beneficiary D can still claim
            await waitClaimTime(communityInstanceB, beneficiaryD);
            await beneficiaryClaim(communityInstanceB, beneficiaryD);
            // balances
            const currentCommunityBalanceA = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
            previousCommunityBalanceA.minus(currentCommunityBalanceA).toString().should.be
                .equal(new BigNumber(claimAmountA * (3 + maxClaimsPerUserA)).multipliedBy(decimals).toString());
            const currentCommunityBalanceB = new BigNumber((await cUSDInstance.balanceOf(communityInstanceB.address)).toString());
            previousCommunityBalanceB.minus(currentCommunityBalanceB).toString().should.be
                .equal(new BigNumber(claimAmountB * (4 + maxClaimsPerUserB)).multipliedBy(decimals).toString());
        });
    });
});