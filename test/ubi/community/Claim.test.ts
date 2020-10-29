import { should } from 'chai';
import BigNumber from 'bignumber.js';
import { ImpactMarketInstance, CommunityInstance, cUSDInstance, CommunityFactoryInstance } from '../../../types/truffle-contracts';
import { ImpactMarket, Community, CommunityFactory, cUSD } from '../../helpers/contracts';
import { defineAccounts } from '../../helpers/accounts';
import {
    decimals,
    hour,
    day,
    claimAmountTwo,
    maxClaimTen,
    fiveCents
} from '../../helpers/constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
should();


/** @test {Community} contract */
contract('Community - Claim', async (accounts) => {
    const {
        adminAccount1,
        communityManagerA,
        beneficiaryA,
        beneficiaryB,
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
        const baseInterval = (await communityInstance.baseInterval()).toNumber();
        const incrementInterval = (await communityInstance.incrementInterval()).toNumber();
        await communityInstance.claim({ from: beneficiaryA });
        await time.increase(time.duration.seconds(baseInterval + 5));
        await communityInstance.claim({ from: beneficiaryA });
        await time.increase(time.duration.seconds(incrementInterval + 5));
        await expectRevert(
            communityInstance.claim({ from: beneficiaryA }),
            "NOT_YET"
        );
        await time.increase(time.duration.seconds(incrementInterval + 5));
        await expectRevert(
            communityInstance.claim({ from: beneficiaryA }),
            "NOT_YET"
        );
    });

    it('should claim after waiting', async () => {
        const baseInterval = (await communityInstance.baseInterval()).toNumber();
        await time.increase(time.duration.seconds(baseInterval + 5));
        await communityInstance.claim({ from: beneficiaryA });
        (await cUSDInstance.balanceOf(beneficiaryA)).toString()
            .should.be.equal(claimAmountTwo.plus(fiveCents).toString());
    });

    it('should not claim after max claim', async () => {
        const baseInterval = (await communityInstance.baseInterval()).toNumber();
        const incrementInterval = (await communityInstance.incrementInterval()).toNumber();
        const claimAmount = new BigNumber((await communityInstance.claimAmount()).toString()).div(decimals).toNumber();
        const maxClaimAmount = new BigNumber((await communityInstance.maxClaim()).toString()).div(decimals).toNumber();
        await communityInstance.claim({ from: beneficiaryA });
        for (let index = 0; index < (maxClaimAmount / claimAmount) - 1; index++) {
            await time.increase(time.duration.seconds(baseInterval + incrementInterval * index + 5));
            await communityInstance.claim({ from: beneficiaryA });
        }
        await time.increase(time.duration.seconds(baseInterval + incrementInterval * (maxClaimAmount / claimAmount) + 5));
        await expectRevert(
            communityInstance.claim({ from: beneficiaryA }),
            "MAX_CLAIM"
        );
    });
});