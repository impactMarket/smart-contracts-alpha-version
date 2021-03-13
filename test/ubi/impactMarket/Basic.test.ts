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
    claimAmountTwo,
    maxClaimTen,
} from '../../helpers/constants';
import { filterEvent } from '../../helpers/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert } = require('@openzeppelin/test-helpers');
should();

/** @test {Community} contract */
describe('ImpactMarket - Basic', () => {
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
        //
        cUSDInstance = (await cUSDContract.deploy()) as Contract & CUsd;
        impactMarketInstance = (await ImpactMarketContract.deploy(
            cUSDInstance.address,
            [accounts.adminAccount1]
        )) as Contract & ImpactMarket;
        communityFactoryInstance = (await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        )) as Contract & CommunityFactory;
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address
        );
    });

    it('should be able to add a community if admin', async () => {
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
        const communityAddress = filterEvent(tx, 'CommunityAdded')!.args![0];
        communityInstance = (await CommunityContract.attach(
            communityAddress
        )) as Contract & Community;
        (await communityInstance.claimAmount())
            .toString()
            .should.be.equal(claimAmountTwo.toString());
        (await communityInstance.baseInterval())
            .toString()
            .should.be.equal('86400');
        (await communityInstance.incrementInterval())
            .toString()
            .should.be.equal('3600');
        (await communityInstance.maxClaim())
            .toString()
            .should.be.equal(maxClaimTen.toString());
    });

    it('should be able to remove a community if admin', async () => {
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
        const communityAddress = filterEvent(tx, 'CommunityAdded')!.args![0];
        await impactMarketInstance
            .connect(signers.adminAccount1)
            .removeCommunity(communityAddress);
    });

    it('should not be able to create a community with invalid values', async () => {
        await expectRevert.unspecified(
            impactMarketInstance
                .connect(signers.adminAccount1)
                .addCommunity(
                    accounts.communityManagerA,
                    claimAmountTwo.toString(),
                    maxClaimTen.toString(),
                    hour.toString(),
                    day.toString()
                )
        );
        await expectRevert.unspecified(
            impactMarketInstance.connect(signers.adminAccount1).addCommunity(
                accounts.communityManagerA,
                maxClaimTen.toString(), // it's supposed to be wrong!
                claimAmountTwo.toString(),
                day.toString(),
                hour.toString()
            )
        );
    });
});
