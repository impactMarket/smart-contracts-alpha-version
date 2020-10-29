import { should } from 'chai';
import { ImpactMarketInstance, CommunityInstance, cUSDInstance, CommunityFactoryInstance } from '../../../types/truffle-contracts';
import { ImpactMarket, Community, CommunityFactory, cUSD } from '../../helpers/contracts';
import { defineAccounts } from '../../helpers/accounts';
import {
    hour,
    day,
    claimAmountTwo,
    maxClaimTen,
    fiveCents
} from '../../helpers/constants';
import { BeneficiaryState } from '../../helpers/utils';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert } = require('@openzeppelin/test-helpers');
should();

/** @test {Community} contract */
contract('Community - Beneficiary', async (accounts) => {
    const {
        adminAccount1,
        communityManagerA,
        beneficiaryA,
    } = defineAccounts(accounts);
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let communityFactoryInstance: CommunityFactoryInstance;
    let cUSDInstance: cUSDInstance;

    beforeEach(async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1]);
        communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, impactMarketInstance.address);
        await impactMarketInstance.setCommunityFactory(communityFactoryInstance.address);
        const tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo,
            maxClaimTen,
            day,
            hour,
            { from: adminAccount1 },
        );
        const communityManagerAddress = tx.logs[1].args[0];
        communityInstance = await Community.at(communityManagerAddress);
        await cUSDInstance.testFakeFundAddress(communityManagerAddress, { from: adminAccount1 });
    });

    it('should be able to add beneficiary to community', async () => {
        (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
        await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
        (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
    });

    it('should give beneficiary 5 cents when adding to community', async () => {
        (await cUSDInstance.balanceOf(beneficiaryA)).toString()
            .should.be.equal('0');
        await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
        (await cUSDInstance.balanceOf(beneficiaryA)).toString()
            .should.be.equal(fiveCents.toString());
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