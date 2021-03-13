import { should } from 'chai';
import { Contract, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';

import { CUsd } from '../../../types/CUsd';
import { Community } from '../../../types/Community';
import { CommunityFactory } from '../../../types/CommunityFactory';
import { ImpactMarket } from '../../../types/ImpactMarket';
import {
    AccountsAddress,
    AccountsSigner,
    defineAccounts,
    defineSigners,
} from '../../helpers/accounts';
import {
    hour,
    day,
    week,
    claimAmountTwo,
    maxClaimTen,
} from '../../helpers/constants';
import { filterEvent } from '../../helpers/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert } = require('@openzeppelin/test-helpers');
should();

/** @test {ImpactMarket} contract */
describe('ImpactMarket - Governance', () => {
    let accounts: AccountsAddress;
    let signers: AccountsSigner;
    // contract instances
    let impactMarketInstance: ImpactMarket;
    let communityInstance: Community;
    let communityFactoryInstance: CommunityFactory;
    let cUSDInstance: CUsd;
    //
    let ImpactMarketContract: ContractFactory;
    let CommunityFactoryContract: ContractFactory;
    let CommunityContract: ContractFactory;
    let cUSDContract: ContractFactory;

    beforeEach(async () => {
        accounts = await defineAccounts();
        signers = await defineSigners();
        //
        ImpactMarketContract = await ethers.getContractFactory('ImpactMarket');
        CommunityFactoryContract = await ethers.getContractFactory(
            'CommunityFactory'
        );
        CommunityContract = await ethers.getContractFactory('Community');
        cUSDContract = await ethers.getContractFactory('cUSD');
    });

    it('should not be able to add community if missing signatures', async () => {
        cUSDInstance = (await cUSDContract.deploy()) as Contract & CUsd;
        impactMarketInstance = (await ImpactMarketContract.deploy(
            cUSDInstance.address,
            [accounts.adminAccount1, accounts.adminAccount2]
        )) as Contract & ImpactMarket;
        communityFactoryInstance = (await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        )) as Contract & CommunityFactory;
        await impactMarketInstance
            .connect(signers.adminAccount1)
            .setCommunityFactory(communityFactoryInstance.address);
        await impactMarketInstance
            .connect(signers.adminAccount2)
            .setCommunityFactory(communityFactoryInstance.address);
        const rawTx = await impactMarketInstance
            .connect(signers.adminAccount1)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        const tx = await rawTx.wait();
        tx.events!.length.should.be.equal(0);
    });

    it('should use differente parameters for each community', async () => {
        cUSDInstance = (await cUSDContract.deploy()) as Contract & CUsd;
        impactMarketInstance = (await ImpactMarketContract.deploy(
            cUSDInstance.address,
            [accounts.adminAccount1, accounts.adminAccount2]
        )) as Contract & ImpactMarket;
        communityFactoryInstance = (await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        )) as Contract & CommunityFactory;
        await impactMarketInstance
            .connect(signers.adminAccount1)
            .setCommunityFactory(communityFactoryInstance.address);
        await impactMarketInstance
            .connect(signers.adminAccount2)
            .setCommunityFactory(communityFactoryInstance.address);
        const rawTx1 = await impactMarketInstance
            .connect(signers.adminAccount1)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        const tx1 = await rawTx1.wait();
        tx1.events!.length.should.be.equal(0);
        const rawTx2 = await impactMarketInstance
            .connect(signers.adminAccount2)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                week.toString(),
                hour.toString()
            );
        const tx2 = await rawTx2.wait();
        tx2.events!.length.should.be.equal(0);
    });

    it('should be able to add community if missing 1 in 3 signatures', async () => {
        cUSDInstance = (await cUSDContract.deploy()) as Contract & CUsd;
        impactMarketInstance = (await ImpactMarketContract.deploy(
            cUSDInstance.address,
            [
                accounts.adminAccount1,
                accounts.adminAccount2,
                accounts.adminAccount3,
            ]
        )) as Contract & ImpactMarket;
        communityFactoryInstance = (await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        )) as Contract & CommunityFactory;
        await impactMarketInstance
            .connect(signers.adminAccount1)
            .setCommunityFactory(communityFactoryInstance.address);
        await impactMarketInstance
            .connect(signers.adminAccount2)
            .setCommunityFactory(communityFactoryInstance.address);
        const rawTx1 = await impactMarketInstance
            .connect(signers.adminAccount1)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        const tx1 = await rawTx1.wait();
        tx1.events!.length.should.be.equal(0);
        const rawTx2 = await impactMarketInstance
            .connect(signers.adminAccount2)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        const tx2 = await rawTx2.wait();
        const communityAddress = filterEvent(tx2, 'CommunityAdded')!.args![0];
        communityInstance = (await CommunityContract.attach(
            communityAddress
        )) as Contract & Community;
        (await communityInstance.claimAmount())
            .toString()
            .should.be.equal(claimAmountTwo.toString());
    });

    it('should be signined by the two admins', async () => {
        cUSDInstance = (await cUSDContract.deploy()) as Contract & CUsd;
        impactMarketInstance = (await ImpactMarketContract.deploy(
            cUSDInstance.address,
            [accounts.adminAccount1, accounts.adminAccount2]
        )) as Contract & ImpactMarket;
        communityFactoryInstance = (await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        )) as Contract & CommunityFactory;
        await impactMarketInstance
            .connect(signers.adminAccount1)
            .setCommunityFactory(communityFactoryInstance.address);
        await impactMarketInstance
            .connect(signers.adminAccount2)
            .setCommunityFactory(communityFactoryInstance.address);
        await impactMarketInstance
            .connect(signers.adminAccount1)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        const rawTx = await impactMarketInstance
            .connect(signers.adminAccount2)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        const tx2 = await rawTx.wait();
        const communityAddress = filterEvent(tx2, 'CommunityAdded')!.args![0];
        communityInstance = (await CommunityContract.attach(
            communityAddress
        )) as Contract & Community;
        (await communityInstance.claimAmount())
            .toString()
            .should.be.equal(claimAmountTwo.toString());
    });

    it('should not be able to sign twice by the same admin', async () => {
        cUSDInstance = (await cUSDContract.deploy()) as Contract & CUsd;
        impactMarketInstance = (await ImpactMarketContract.deploy(
            cUSDInstance.address,
            [accounts.adminAccount1, accounts.adminAccount2]
        )) as Contract & ImpactMarket;
        communityFactoryInstance = (await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        )) as Contract & CommunityFactory;
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address
        );
        await impactMarketInstance
            .connect(signers.adminAccount1)
            .addCommunity(
                accounts.communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        await expectRevert(
            impactMarketInstance
                .connect(signers.adminAccount1)
                .addCommunity(
                    accounts.communityManagerA,
                    claimAmountTwo.toString(),
                    maxClaimTen.toString(),
                    day.toString(),
                    hour.toString()
                ),
            'SIGNED'
        );
    });
});
