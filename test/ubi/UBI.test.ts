import BigNumber from 'bignumber.js';
import { should } from 'chai';
import { Contract, ContractFactory, Signer } from 'ethers';
import { ethers } from 'hardhat';

import { CUSD } from '../../types/CUSD';
import { Community } from '../../types/Community';
import { CommunityFactory } from '../../types/CommunityFactory';
import { ImpactMarket } from '../../types/ImpactMarket';
import {
    AccountsAddress,
    AccountsSigner,
    defineAccounts,
    defineSigners,
} from '../helpers/accounts';
import {
    decimals,
    hour,
    day,
    claimAmountTwo,
    maxClaimTen,
    fiveCents,
} from '../helpers/constants';
import { BeneficiaryState, BNtoBigNumber, filterEvent } from '../helpers/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, time } = require('@openzeppelin/test-helpers');
should();

/** @test {ImpactMarket} contract */
describe('Chaos test (complete flow)', () => {
    let accounts: AccountsAddress;
    let signers: AccountsSigner;
    // contract instances
    let impactMarketInstance: Contract & ImpactMarket;
    let communityFactoryInstance: Contract & CommunityFactory;
    let cUSDInstance: Contract & CUSD;
    //
    let ImpactMarketContract: ContractFactory;
    let CommunityFactoryContract: ContractFactory;
    let CommunityContract: ContractFactory;
    let cUSDContract: ContractFactory;

    // add community
    const addCommunity = async (
        communityManager: string
    ): Promise<Contract & Community> => {
        const rawTx = await impactMarketInstance
            .connect(signers.adminAccount1)
            .addCommunity(
                communityManager,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                day.toString(),
                hour.toString()
            );
        // eslint-disable-next-line prefer-const
        const tx = await rawTx.wait();
        const communityAddress = filterEvent(tx, 'CommunityAdded')!.args![0];
        const instance = (await CommunityContract.attach(
            communityAddress
        )) as Contract & Community;
        await cUSDInstance
            .connect(signers.adminAccount1)
            .testFakeFundAddress(communityAddress);
        return instance;
    };
    // add beneficiary
    const addBeneficiary = async (
        instance: Contract & Community,
        beneficiaryAddress: string,
        communityManagerSigner: Signer
    ): Promise<void> => {
        const rawTx = await instance
            .connect(communityManagerSigner)
            .addBeneficiary(beneficiaryAddress);
        const tx = await rawTx.wait();
        const blockData = await ethers.provider.getBlock(tx.blockNumber);
        (await instance.beneficiaries(beneficiaryAddress))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
        (await instance.cooldown(beneficiaryAddress))
            .toNumber()
            .should.be.equal(blockData.timestamp);
    };
    // wait claim time
    const waitClaimTime = async (
        instance: Contract & Community,
        beneficiaryAddress: string
    ): Promise<void> => {
        const waitIs = (
            await instance.lastInterval(beneficiaryAddress)
        ).toNumber();
        await time.increase(time.duration.seconds(waitIs + 5)); // wait is + 5
    };
    // claim
    const beneficiaryClaim = async (
        instance: Contract & Community,
        beneficiaryAddress: string,
        beneficiarySigner: Signer
    ): Promise<void> => {
        const previousBalance = BNtoBigNumber(
            await cUSDInstance.balanceOf(beneficiaryAddress)
        );
        const previousLastInterval = BNtoBigNumber(
            await instance.lastInterval(beneficiaryAddress)
        );
        await instance.connect(beneficiarySigner).claim();
        const currentBalance = BNtoBigNumber(
            await cUSDInstance.balanceOf(beneficiaryAddress)
        );
        const currentLastInterval = BNtoBigNumber(
            await instance.lastInterval(beneficiaryAddress)
        );
        previousBalance
            .plus(BNtoBigNumber(await instance.claimAmount()))
            .toString()
            .should.be.equal(currentBalance.toString());
        previousLastInterval
            .plus(BNtoBigNumber(await instance.incrementInterval()))
            .toString()
            .should.be.equal(currentLastInterval.toString());
    };

    //
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
    });
    it('one beneficiary to one community', async () => {
        const communityInstanceA = await addCommunity(
            accounts.communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.communityManagerA
        );
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
        await expectRevert(
            beneficiaryClaim(
                communityInstanceA,
                accounts.beneficiaryA,
                signers.beneficiaryA
            ),
            'NOT_YET'
        );
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
    });

    it('many beneficiaries to one community', async () => {
        const communityInstanceA = await addCommunity(
            accounts.communityManagerA
        );
        const previousCommunityBalance = new BigNumber(
            (
                await cUSDInstance.balanceOf(communityInstanceA.address)
            ).toString()
        );
        await addBeneficiary(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            accounts.beneficiaryB,
            signers.communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            accounts.beneficiaryC,
            signers.communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            accounts.beneficiaryD,
            signers.communityManagerA
        );
        // beneficiary A claims twice
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
        // beneficiary B claims once
        await waitClaimTime(communityInstanceA, accounts.beneficiaryB);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryB,
            signers.beneficiaryB
        );
        // beneficiary C claims it all
        const claimAmount = new BigNumber(
            (await communityInstanceA.claimAmount()).toString()
        )
            .div(decimals)
            .toNumber();
        const maxClaimAmount = new BigNumber(
            (await communityInstanceA.maxClaim()).toString()
        )
            .div(decimals)
            .toNumber();
        const maxClaimsPerUser = maxClaimAmount / claimAmount;
        for (let index = 0; index < maxClaimsPerUser; index++) {
            await waitClaimTime(communityInstanceA, accounts.beneficiaryC);
            await beneficiaryClaim(
                communityInstanceA,
                accounts.beneficiaryC,
                signers.beneficiaryC
            );
        }
        // beneficiary B can still claim
        await waitClaimTime(communityInstanceA, accounts.beneficiaryB);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryB,
            signers.beneficiaryB
        );
        // beneficiary A can still claim
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
        // beneficiary C can't claim anymore
        await waitClaimTime(communityInstanceA, accounts.beneficiaryC);
        await expectRevert(
            beneficiaryClaim(
                communityInstanceA,
                accounts.beneficiaryC,
                signers.beneficiaryC
            ),
            'MAX_CLAIM'
        );
        const currentCommunityBalance = new BigNumber(
            (
                await cUSDInstance.balanceOf(communityInstanceA.address)
            ).toString()
        );
        previousCommunityBalance
            .minus(currentCommunityBalance)
            .toString()
            .should.be.equal(
                new BigNumber(claimAmount * (5 + maxClaimsPerUser))
                    .multipliedBy(decimals)
                    .plus(4 * fiveCents.toNumber())
                    .toString()
            );
    });

    it('many beneficiaries to many communities', async () => {
        // community A
        const communityInstanceA = await addCommunity(
            accounts.communityManagerA
        );
        const communityInstanceB = await addCommunity(
            accounts.communityManagerB
        );
        const previousCommunityBalanceA = new BigNumber(
            (
                await cUSDInstance.balanceOf(communityInstanceA.address)
            ).toString()
        );
        const previousCommunityBalanceB = new BigNumber(
            (
                await cUSDInstance.balanceOf(communityInstanceB.address)
            ).toString()
        );
        //
        await addBeneficiary(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            accounts.beneficiaryB,
            signers.communityManagerA
        );
        //
        await addBeneficiary(
            communityInstanceB,
            accounts.beneficiaryC,
            signers.communityManagerB
        );
        await addBeneficiary(
            communityInstanceB,
            accounts.beneficiaryD,
            signers.communityManagerB
        );
        // beneficiary A claims twice
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
        // beneficiary B claims it all
        const claimAmountA = new BigNumber(
            (await communityInstanceA.claimAmount()).toString()
        )
            .div(decimals)
            .toNumber();
        const maxClaimAmountA = new BigNumber(
            (await communityInstanceA.maxClaim()).toString()
        )
            .div(decimals)
            .toNumber();
        const maxClaimsPerUserA = maxClaimAmountA / claimAmountA;
        for (let index = 0; index < maxClaimsPerUserA; index++) {
            await waitClaimTime(communityInstanceA, accounts.beneficiaryB);
            await beneficiaryClaim(
                communityInstanceA,
                accounts.beneficiaryB,
                signers.beneficiaryB
            );
        }
        // beneficiary C claims it all
        const claimAmountB = new BigNumber(
            (await communityInstanceB.claimAmount()).toString()
        )
            .div(decimals)
            .toNumber();
        const maxClaimAmountB = new BigNumber(
            (await communityInstanceB.maxClaim()).toString()
        )
            .div(decimals)
            .toNumber();
        const maxClaimsPerUserB = maxClaimAmountB / claimAmountB;
        for (let index = 0; index < maxClaimsPerUserB; index++) {
            await waitClaimTime(communityInstanceB, accounts.beneficiaryC);
            await beneficiaryClaim(
                communityInstanceB,
                accounts.beneficiaryC,
                signers.beneficiaryC
            );
        }
        // beneficiary D claims three times
        await waitClaimTime(communityInstanceB, accounts.beneficiaryD);
        await beneficiaryClaim(
            communityInstanceB,
            accounts.beneficiaryD,
            signers.beneficiaryD
        );
        await waitClaimTime(communityInstanceB, accounts.beneficiaryD);
        await beneficiaryClaim(
            communityInstanceB,
            accounts.beneficiaryD,
            signers.beneficiaryD
        );
        await waitClaimTime(communityInstanceB, accounts.beneficiaryD);
        await beneficiaryClaim(
            communityInstanceB,
            accounts.beneficiaryD,
            signers.beneficiaryD
        );
        // beneficiary A can still claim
        await waitClaimTime(communityInstanceA, accounts.beneficiaryA);
        await beneficiaryClaim(
            communityInstanceA,
            accounts.beneficiaryA,
            signers.beneficiaryA
        );
        // beneficiary C can't claim anymore
        await waitClaimTime(communityInstanceB, accounts.beneficiaryC);
        await expectRevert(
            beneficiaryClaim(
                communityInstanceB,
                accounts.beneficiaryC,
                signers.beneficiaryC
            ),
            'MAX_CLAIM'
        );
        // beneficiary B can't claim anymore
        await waitClaimTime(communityInstanceB, accounts.beneficiaryC);
        await expectRevert(
            beneficiaryClaim(
                communityInstanceB,
                accounts.beneficiaryC,
                signers.beneficiaryC
            ),
            'MAX_CLAIM'
        );
        // beneficiary D can still claim
        await waitClaimTime(communityInstanceB, accounts.beneficiaryD);
        await beneficiaryClaim(
            communityInstanceB,
            accounts.beneficiaryD,
            signers.beneficiaryD
        );
        // balances
        const currentCommunityBalanceA = new BigNumber(
            (
                await cUSDInstance.balanceOf(communityInstanceA.address)
            ).toString()
        );
        previousCommunityBalanceA
            .minus(currentCommunityBalanceA)
            .toString()
            .should.be.equal(
                new BigNumber(claimAmountA * (3 + maxClaimsPerUserA))
                    .multipliedBy(decimals)
                    .plus(2 * fiveCents.toNumber())
                    .toString()
            );
        const currentCommunityBalanceB = new BigNumber(
            (
                await cUSDInstance.balanceOf(communityInstanceB.address)
            ).toString()
        );
        previousCommunityBalanceB
            .minus(currentCommunityBalanceB)
            .toString()
            .should.be.equal(
                new BigNumber(claimAmountB * (4 + maxClaimsPerUserB))
                    .multipliedBy(decimals)
                    .plus(2 * fiveCents.toNumber())
                    .toString()
            );
    });
});
