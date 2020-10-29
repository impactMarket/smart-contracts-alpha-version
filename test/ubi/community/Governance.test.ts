import { should } from 'chai';
import { ImpactMarketInstance, CommunityInstance, CUsdInstance, CommunityFactoryInstance } from '../../../types/contracts/truffle';
import { ImpactMarket, Community, CommunityFactory, cUSD } from '../../helpers/contracts';
import { defineAccounts } from '../../helpers/accounts';
import {
    hour,
    day,
    week,
    claimAmountTwo,
    maxClaimTen,
} from '../../helpers/constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, expectEvent, constants } = require('@openzeppelin/test-helpers');
should();


/** @test {Community} contract */
contract('Community - Governance', async (accounts) => {
    const {
        adminAccount1,
        adminAccount2,
        communityManagerA,
        communityManagerB,
        communityManagerC,
    } = defineAccounts(accounts);
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let communityFactoryInstance: CommunityFactoryInstance;
    let cUSDInstance: CUsdInstance;

    beforeEach(async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1]);
        communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, impactMarketInstance.address);
        await impactMarketInstance.setCommunityFactory(communityFactoryInstance.address);
        const tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 },
        );
        const communityAddress = tx.logs[2].args[0];
        communityInstance = await Community.at(communityAddress);
    });

    it('should not be able to grantRole', async () => {
        await expectRevert(
            impactMarketInstance.grantRole(
                await impactMarketInstance.ADMIN_ROLE(),
                adminAccount2,
                { from: adminAccount1 },
            ),
            'NOT_ALLOWED'
        );
    });

    it('should not be able to revokeRole', async () => {
        await expectRevert(
            impactMarketInstance.revokeRole(
                await impactMarketInstance.ADMIN_ROLE(),
                adminAccount1,
                { from: adminAccount1 },
            ),
            'NOT_ALLOWED'
        );
    });

    it('should not be able to renounceRole', async () => {
        await expectRevert(
            impactMarketInstance.renounceRole(
                await impactMarketInstance.ADMIN_ROLE(),
                adminAccount1,
                { from: adminAccount1 },
            ),
            'NOT_ALLOWED'
        );
    });

    it('should be able to migrate funds from community if impactMarket admin', async () => {
        const previousCommunityPreviousBalance = await cUSDInstance.balanceOf(communityInstance.address);
        const newCommunityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, impactMarketInstance.address);
        const newTx = await impactMarketInstance.migrateCommunity(
            communityManagerA,
            communityInstance.address,
            newCommunityFactoryInstance.address,
            { from: adminAccount1 },
        );
        const newCommunityAddress = newTx.logs[2].args[1];
        communityInstance = await Community.at(newCommunityAddress);
        const previousCommunityNewBalance = await cUSDInstance.balanceOf(communityInstance.address);
        const newCommunityNewBalance = await cUSDInstance.balanceOf(newCommunityAddress);
        previousCommunityPreviousBalance.toString().should.be.equal(newCommunityNewBalance.toString());
        previousCommunityNewBalance.toString().should.be.equal('0');
    });

    it('should not be able toset factory from invalid impactMarket contract', async () => {
        const impactMarketInstance2 = await ImpactMarket.new(cUSDInstance.address, [adminAccount2], { from: adminAccount2 });
        await expectRevert(
            impactMarketInstance2.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount2 }),
            'NOT_ALLOWED'
        );
    });

    it('should not be able to migrate from invalid community', async () => {
        const newCommunityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, impactMarketInstance.address);
        await expectRevert(
            impactMarketInstance.migrateCommunity(
                communityManagerA,
                constants.ZERO_ADDRESS,
                newCommunityFactoryInstance.address,
                { from: adminAccount1 },
            ),
            'NOT_VALID'
        );
    });

    it('should not be able to migrate community if not admin', async () => {
        const newCommunityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, impactMarketInstance.address);
        await expectRevert(
            impactMarketInstance.migrateCommunity(
                communityManagerA,
                cUSDInstance.address, // wrong on purpose
                newCommunityFactoryInstance.address,
                { from: adminAccount2 },
            ),
            'NOT_ADMIN'
        );
    });

    it('should be able edit community if manager', async () => {
        (await communityInstance.incrementInterval()).toString().should.be.equal(hour.toString());
        await communityInstance.edit(
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            week,
            day,
            { from: communityManagerA }
        );
        (await communityInstance.incrementInterval()).toString().should.be.equal(day.toString());
    });

    it('should not be able edit community if not manager', async () => {
        await expectRevert(
            communityInstance.edit(
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day,
                day,
                { from: communityManagerB }
            ),
            "NOT_MANAGER"
        );
    });

    it('should not be able edit community with invalid values', async () => {
        await expectRevert.unspecified(
            communityInstance.edit(
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day,
                week,
                { from: communityManagerA }
            )
        );
        await expectRevert.unspecified(
            communityInstance.edit(
                maxClaimTen.toString(), // supposed to be wrong
                claimAmountTwo.toString(),
                week,
                day,
                { from: communityManagerA }
            )
        );
    });

    it('should not be able to add manager to community if not manager', async () => {
        await expectRevert(
            communityInstance.addManager(communityManagerB, { from: communityManagerC }),
            "NOT_MANAGER"
        );
    });

    it('should not be able to remove manager from community if not manager', async () => {
        await communityInstance.addManager(communityManagerB, { from: communityManagerA });
        await expectRevert(
            communityInstance.removeManager(communityManagerB, { from: communityManagerC }),
            "NOT_MANAGER"
        );
    });

    it('should be able to add manager to community if manager', async () => {
        await communityInstance.addManager(communityManagerB, { from: communityManagerA });
    });

    it('should be able to remove manager to community if manager', async () => {
        await communityInstance.addManager(communityManagerB, { from: communityManagerA });
        await communityInstance.removeManager(communityManagerB, { from: communityManagerA });
    });

    it('should be able to renounce from manager of community if manager', async () => {
        await communityInstance.addManager(communityManagerB, { from: communityManagerA });
        await communityInstance.renounceRole(
            await communityInstance.MANAGER_ROLE(),
            communityManagerB, { from: communityManagerB }
        );
    });

    it('should be able to lock community if manager', async () => {
        const receipt = await communityInstance.lock({ from: communityManagerA });
        expectEvent(receipt, 'CommunityLocked', {
            _by: communityManagerA,
        });
    });

    it('should be able to lock community if manager', async () => {
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