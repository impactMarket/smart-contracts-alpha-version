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
    week,
    claimAmountTwo,
    maxClaimTen,
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
const {
    expectRevert,
    expectEvent,
    constants,
} = require('@openzeppelin/test-helpers');
should();

/** @test {Community} contract */
describe('Community - Governance', () => {
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
    });

    it('should not be able to grantRole', async () => {
        await expectRevert(
            impactMarketInstance
                .connect(signers.adminAccount1)
                .grantRole(
                    await impactMarketInstance.ADMIN_ROLE(),
                    accounts.adminAccount2
                ),
            'NOT_ALLOWED'
        );
    });

    it('should not be able to revokeRole', async () => {
        await expectRevert(
            impactMarketInstance
                .connect(signers.adminAccount1)
                .revokeRole(
                    await impactMarketInstance.ADMIN_ROLE(),
                    accounts.adminAccount1
                ),
            'NOT_ALLOWED'
        );
    });

    it('should not be able to renounceRole', async () => {
        await expectRevert(
            impactMarketInstance
                .connect(signers.adminAccount1)
                .renounceRole(
                    await impactMarketInstance.ADMIN_ROLE(),
                    accounts.adminAccount1
                ),
            'NOT_ALLOWED'
        );
    });

    it('should be able to migrate funds from community if impactMarket admin', async () => {
        const previousCommunityPreviousBalance = await cUSDInstance.balanceOf(
            communityInstance.address
        );
        const newCommunityFactoryInstance = await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        const newTxRaw = await impactMarketInstance
            .connect(signers.adminAccount1)
            .migrateCommunity(
                accounts.communityManagerA,
                communityInstance.address,
                newCommunityFactoryInstance.address
            );
        const newTx = await newTxRaw.wait();
        const newCommunityAddress = (newTx.events![5].args as any)
            ._communityAddress;
        communityInstance = (await CommunityContract.attach(
            newCommunityAddress
        )) as Contract & Community;
        const previousCommunityNewBalance = await cUSDInstance.balanceOf(
            communityInstance.address
        );
        const newCommunityNewBalance = await cUSDInstance.balanceOf(
            newCommunityAddress
        );
        previousCommunityPreviousBalance
            .toString()
            .should.be.equal(newCommunityNewBalance.toString());
        previousCommunityNewBalance.toString().should.be.equal('0');
    });

    it('should not be able toset factory from invalid impactMarket contract', async () => {
        const impactMarketInstance2 = await ImpactMarketContract.connect(
            signers.adminAccount2
        ).deploy(cUSDInstance.address, [accounts.adminAccount2]);
        await expectRevert(
            impactMarketInstance2
                .connect(signers.adminAccount2)
                .setCommunityFactory(communityFactoryInstance.address),
            'NOT_ALLOWED'
        );
    });

    it('should not be able to migrate from invalid community', async () => {
        const newCommunityFactoryInstance = await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await expectRevert(
            impactMarketInstance
                .connect(signers.adminAccount1)
                .migrateCommunity(
                    accounts.communityManagerA,
                    constants.ZERO_ADDRESS,
                    newCommunityFactoryInstance.address
                ),
            'NOT_VALID'
        );
    });

    it('should not be able to migrate community if not admin', async () => {
        const newCommunityFactoryInstance = await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await expectRevert(
            impactMarketInstance
                .connect(signers.adminAccount2)
                .migrateCommunity(
                    accounts.communityManagerA,
                    cUSDInstance.address, // wrong on purpose
                    newCommunityFactoryInstance.address
                ),
            'NOT_ADMIN'
        );
    });

    it('should be able edit community if manager', async () => {
        (await communityInstance.incrementInterval())
            .toString()
            .should.be.equal(hour.toString());
        await communityInstance
            .connect(signers.communityManagerA)
            .edit(
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                week.toString(),
                day.toString()
            );
        (await communityInstance.incrementInterval())
            .toString()
            .should.be.equal(day.toString());
    });

    it('should not be able edit community if not manager', async () => {
        await expectRevert(
            communityInstance
                .connect(signers.communityManagerB)
                .edit(
                    claimAmountTwo.toString(),
                    maxClaimTen.toString(),
                    day.toString(),
                    day.toString()
                ),
            'NOT_MANAGER'
        );
    });

    it('should not be able edit community with invalid values', async () => {
        await expectRevert.unspecified(
            communityInstance
                .connect(signers.communityManagerA)
                .edit(
                    claimAmountTwo.toString(),
                    maxClaimTen.toString(),
                    day.toString(),
                    week.toString()
                )
        );
        await expectRevert.unspecified(
            communityInstance.connect(signers.communityManagerA).edit(
                maxClaimTen.toString(), // supposed to be wrong
                claimAmountTwo.toString(),
                week.toString(),
                day.toString()
            )
        );
    });

    it('should not be able to add manager to community if not manager', async () => {
        await expectRevert(
            communityInstance
                .connect(signers.communityManagerC)
                .addManager(accounts.communityManagerB),
            'NOT_MANAGER'
        );
    });

    it('should not be able to remove manager from community if not manager', async () => {
        await communityInstance
            .connect(signers.communityManagerA)
            .addManager(accounts.communityManagerB);
        await expectRevert(
            communityInstance
                .connect(signers.communityManagerC)
                .removeManager(accounts.communityManagerB),
            'NOT_MANAGER'
        );
    });

    it('should be able to add manager to community if manager', async () => {
        await communityInstance
            .connect(signers.communityManagerA)
            .addManager(accounts.communityManagerB);
    });

    it('should be able to remove manager to community if manager', async () => {
        await communityInstance
            .connect(signers.communityManagerA)
            .addManager(accounts.communityManagerB);
        await communityInstance
            .connect(signers.communityManagerA)
            .removeManager(accounts.communityManagerB);
    });

    it('should be able to renounce from manager of community if manager', async () => {
        await communityInstance
            .connect(signers.communityManagerA)
            .addManager(accounts.communityManagerB);
        await communityInstance
            .connect(signers.communityManagerB)
            .renounceRole(
                await communityInstance.MANAGER_ROLE(),
                accounts.communityManagerB
            );
    });

    it('should be able to lock community if manager', async () => {
        const receipt = await communityInstance
            .connect(signers.communityManagerA)
            .lock();
        // expectEvent(receipt, 'CommunityLocked', {
        //     _by: accounts.communityManagerA,
        // });
    });

    it('should be able to unlock community if manager', async () => {
        let receipt = await communityInstance
            .connect(signers.communityManagerA)
            .lock();
        // expectEvent(receipt, 'CommunityLocked', {
        //     _by: accounts.communityManagerA,
        // });
        receipt = await communityInstance
            .connect(signers.communityManagerA)
            .unlock();
        // expectEvent(receipt, 'CommunityUnlocked', {
        //     _by: accounts.communityManagerA,
        // });
    });
});
