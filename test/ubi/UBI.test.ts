import BigNumber from 'bignumber.js';
import { should } from 'chai';

import {
    ImpactMarketInstance,
    CommunityInstance,
    CUsdInstance,
    CommunityFactoryInstance,
} from '../../types/contracts/truffle';
import { defineAccounts } from '../helpers/accounts';
import {
    decimals,
    hour,
    day,
    claimAmountTwo,
    maxClaimTen,
    fiveCents,
} from '../helpers/constants';
import {
    ImpactMarket,
    Community,
    CommunityFactory,
    cUSD,
} from '../helpers/contracts';
import { BeneficiaryState, BNtoBigNumber } from '../helpers/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, time } = require('@openzeppelin/test-helpers');
should();

/** @test {ImpactMarket} contract */
contract('Chaos test (complete flow)', async (accounts) => {
    const {
        adminAccount1,
        communityManagerA,
        communityManagerB,
        beneficiaryA,
        beneficiaryB,
        beneficiaryC,
        beneficiaryD,
    } = defineAccounts(accounts);
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    // let communityInstance: CommunityInstance;
    let communityFactoryInstance: CommunityFactoryInstance;
    let cUSDInstance: CUsdInstance;

    // add community
    const addCommunity = async (
        communityManager: string
    ): Promise<CommunityInstance> => {
        const tx = await impactMarketInstance.addCommunity(
            communityManager,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        // eslint-disable-next-line prefer-const
        const communityManagerAddress = tx.logs[2].args[0] as string;
        const instance = await Community.at(communityManagerAddress);
        await cUSDInstance.testFakeFundAddress(communityManagerAddress, {
            from: adminAccount1,
        });
        return instance;
    };
    // add beneficiary
    const addBeneficiary = async (
        instance: CommunityInstance,
        beneficiaryAddress: string,
        communityManagerAddress: string
    ): Promise<void> => {
        const tx = await instance.addBeneficiary(beneficiaryAddress, {
            from: communityManagerAddress,
        });
        const blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
        (await instance.beneficiaries(beneficiaryAddress))
            .toString()
            .should.be.equal(BeneficiaryState.Valid);
        (await instance.cooldown(beneficiaryAddress))
            .toNumber()
            .should.be.equal(blockData.timestamp);
    };
    // wait claim time
    const waitClaimTime = async (
        instance: CommunityInstance,
        beneficiaryAddress: string
    ): Promise<void> => {
        const waitIs = (
            await instance.lastInterval(beneficiaryAddress)
        ).toNumber();
        await time.increase(time.duration.seconds(waitIs + 5)); // wait is + 5
    };
    // claim
    const beneficiaryClaim = async (
        instance: CommunityInstance,
        beneficiaryAddress: string
    ): Promise<void> => {
        const previousBalance = BNtoBigNumber(
            await cUSDInstance.balanceOf(beneficiaryAddress)
        );
        const previousLastInterval = BNtoBigNumber(
            await instance.lastInterval(beneficiaryAddress)
        );
        await instance.claim({ from: beneficiaryAddress });
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
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [
            adminAccount1,
        ]);
        communityFactoryInstance = await CommunityFactory.new(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address
        );
    });
    it('one beneficiary to one community', async () => {
        const communityInstanceA = await addCommunity(communityManagerA);
        await addBeneficiary(
            communityInstanceA,
            beneficiaryA,
            communityManagerA
        );
        await waitClaimTime(communityInstanceA, beneficiaryA);
        await beneficiaryClaim(communityInstanceA, beneficiaryA);
        await expectRevert(
            beneficiaryClaim(communityInstanceA, beneficiaryA),
            'NOT_YET'
        );
        await waitClaimTime(communityInstanceA, beneficiaryA);
        await beneficiaryClaim(communityInstanceA, beneficiaryA);
    });

    it('many beneficiaries to one community', async () => {
        const communityInstanceA = await addCommunity(communityManagerA);
        const previousCommunityBalance = new BigNumber(
            (
                await cUSDInstance.balanceOf(communityInstanceA.address)
            ).toString()
        );
        await addBeneficiary(
            communityInstanceA,
            beneficiaryA,
            communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            beneficiaryB,
            communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            beneficiaryC,
            communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            beneficiaryD,
            communityManagerA
        );
        // beneficiary A claims twice
        await waitClaimTime(communityInstanceA, beneficiaryA);
        await beneficiaryClaim(communityInstanceA, beneficiaryA);
        await waitClaimTime(communityInstanceA, beneficiaryA);
        await beneficiaryClaim(communityInstanceA, beneficiaryA);
        // beneficiary B claims once
        await waitClaimTime(communityInstanceA, beneficiaryB);
        await beneficiaryClaim(communityInstanceA, beneficiaryB);
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
        const communityInstanceA = await addCommunity(communityManagerA);
        const communityInstanceB = await addCommunity(communityManagerB);
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
            beneficiaryA,
            communityManagerA
        );
        await addBeneficiary(
            communityInstanceA,
            beneficiaryB,
            communityManagerA
        );
        //
        await addBeneficiary(
            communityInstanceB,
            beneficiaryC,
            communityManagerB
        );
        await addBeneficiary(
            communityInstanceB,
            beneficiaryD,
            communityManagerB
        );
        // beneficiary A claims twice
        await waitClaimTime(communityInstanceA, beneficiaryA);
        await beneficiaryClaim(communityInstanceA, beneficiaryA);
        await waitClaimTime(communityInstanceA, beneficiaryA);
        await beneficiaryClaim(communityInstanceA, beneficiaryA);
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
            await waitClaimTime(communityInstanceA, beneficiaryB);
            await beneficiaryClaim(communityInstanceA, beneficiaryB);
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
            'MAX_CLAIM'
        );
        // beneficiary B can't claim anymore
        await waitClaimTime(communityInstanceB, beneficiaryC);
        await expectRevert(
            beneficiaryClaim(communityInstanceB, beneficiaryC),
            'MAX_CLAIM'
        );
        // beneficiary D can still claim
        await waitClaimTime(communityInstanceB, beneficiaryD);
        await beneficiaryClaim(communityInstanceB, beneficiaryD);
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
