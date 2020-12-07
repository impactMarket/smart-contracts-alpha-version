import { ethers } from 'hardhat';
import { should } from 'chai';
import { Contract, ContractFactory } from 'ethers';

// import {
//     ImpactMarketInstance,
//     CommunityInstance,
//     CUSDInstance,
//     CommunityFactoryInstance,
// } from '../../../types/truffle-contracts';
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
    fiveCents,
} from '../../helpers/constants';
// import {
//     ImpactMarket,
//     Community,
//     CommunityFactory,
//     cUSD,
// } from '../../helpers/contracts';
import { BeneficiaryState } from '../../helpers/utils';
import { ImpactMarket } from '../../../types/ImpactMarket';
import { CUSD } from '../../../types/CUSD';
import { Community } from '../../../types/Community';
import { CommunityFactory } from '../../../types/CommunityFactory';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert } = require('@openzeppelin/test-helpers');
should();

/** @test {Community} contract */
describe('Community - Beneficiary', () => {
    let accounts: AccountsAddress;
    let signers: AccountsSigner;
    // contract instances
    let impactMarketInstance: Contract & ImpactMarket;
    let communityInstance: Contract & Community;
    let communityFactoryInstance: Contract & CommunityFactory;
    let cUSDInstance: Contract & CUSD;
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
        cUSDInstance = (await cUSDContract.deploy()) as Contract & CUSD;
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
        const pendingTx = await impactMarketInstance.addCommunity(
            accounts.communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day.toString(),
            hour.toString()
        );
        const tx = await pendingTx.wait();
        const communityAddress = tx.events![3].args![0];
        communityInstance = (await CommunityContract.attach(
            communityAddress
        )) as Contract & Community;
        communityInstance = communityInstance.connect(
            signers.communityManagerA
        ) as Contract & Community;
        await cUSDInstance.testFakeFundAddress(communityAddress);
    });

    it('should be able to add beneficiary to community', async () => {
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.NONE);
        await communityInstance.addBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
    });

    it('should give beneficiary 5 cents when adding to community', async () => {
        (await cUSDInstance.balanceOf(accounts.beneficiaryA))
            .toString()
            .should.be.equal('0');
        await communityInstance.addBeneficiary(accounts.beneficiaryA);
        (await cUSDInstance.balanceOf(accounts.beneficiaryA))
            .toString()
            .should.be.equal(fiveCents.toString());
    });

    it('should be able to lock beneficiary from community', async () => {
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.NONE);
        await communityInstance.addBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
        await communityInstance.lockBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Locked);
    });

    it('should not be able to lock an invalid beneficiary from community', async () => {
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.NONE);
        await expectRevert(
            communityInstance.lockBeneficiary(accounts.beneficiaryA),
            'NOT_YET'
        );
    });

    it('should be able to unlock locked beneficiary from community', async () => {
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.NONE);
        await communityInstance.addBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
        await communityInstance.lockBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Locked);
        await communityInstance.unlockBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
    });

    it('should not be able to unlock a not locked beneficiary from community', async () => {
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.NONE);
        await communityInstance.addBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
        await expectRevert(
            communityInstance.unlockBeneficiary(accounts.beneficiaryA),
            'NOT_YET'
        );
    });

    it('should be able to remove beneficiary from community', async () => {
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.NONE);
        await communityInstance.addBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
        await communityInstance.removeBeneficiary(accounts.beneficiaryA);
        (await communityInstance.beneficiaries(accounts.beneficiaryA))
            .toString()
            .should.be.equal(BeneficiaryState.Removed);
    });
});
