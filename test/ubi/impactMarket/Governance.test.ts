import { should } from 'chai';

import {
    ImpactMarketInstance,
    CommunityInstance,
    CUsdInstance,
    CommunityFactoryInstance,
} from '../../../types/contracts/truffle';
import { defineAccounts } from '../../helpers/accounts';
import {
    hour,
    day,
    week,
    claimAmountTwo,
    maxClaimTen,
} from '../../helpers/constants';
import {
    ImpactMarket,
    Community,
    CommunityFactory,
    cUSD,
} from '../../helpers/contracts';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert } = require('@openzeppelin/test-helpers');
should();

/** @test {ImpactMarket} contract */
contract('ImpactMarket - Governance', async (accounts) => {
    const {
        adminAccount1,
        adminAccount2,
        adminAccount3,
        communityManagerA,
    } = defineAccounts(accounts);
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let communityFactoryInstance: CommunityFactoryInstance;
    let cUSDInstance: CUsdInstance;

    it('should not be able to add community if missing signatures', async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [
            adminAccount1,
            adminAccount2,
        ]);
        communityFactoryInstance = await CommunityFactory.new(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount1 }
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount2 }
        );
        const tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        tx.logs.length.should.be.equal(0);
    });

    it('should use differente parameters for each community', async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [
            adminAccount1,
            adminAccount2,
        ]);
        communityFactoryInstance = await CommunityFactory.new(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount1 }
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount2 }
        );
        let tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        tx.logs.length.should.be.equal(0);
        tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            week,
            hour,
            { from: adminAccount2 }
        );
        tx.logs.length.should.be.equal(0);
    });

    it('should be able to add community if missing 1 in 3 signatures', async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [
            adminAccount1,
            adminAccount2,
            adminAccount3,
        ]);
        communityFactoryInstance = await CommunityFactory.new(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount1 }
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount2 }
        );
        const tx1 = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        tx1.logs.length.should.be.equal(0);
        const tx2 = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount2 }
        );
        const communityAddress = tx2.logs[2].args[0];
        communityInstance = await Community.at(communityAddress);
        (await communityInstance.claimAmount())
            .toString()
            .should.be.equal(claimAmountTwo.toString());
    });

    it('should be signined by the two admins', async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [
            adminAccount1,
            adminAccount2,
        ]);
        communityFactoryInstance = await CommunityFactory.new(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount1 }
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address,
            { from: adminAccount2 }
        );
        await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        const tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount2 }
        );
        const communityAddress = tx.logs[2].args[0];
        communityInstance = await Community.at(communityAddress);
        (await communityInstance.claimAmount())
            .toString()
            .should.be.equal(claimAmountTwo.toString());
    });

    it('should not be able to sign twice by the same admin', async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [
            adminAccount1,
            adminAccount2,
        ]);
        communityFactoryInstance = await CommunityFactory.new(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address
        );
        await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        await expectRevert(
            impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day,
                hour,
                { from: adminAccount1 }
            ),
            'SIGNED'
        );
    });
});
