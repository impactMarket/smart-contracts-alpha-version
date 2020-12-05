import { ethers } from "hardhat";
import { Contract } from 'ethers';


import BigNumber from 'bignumber.js';
import { should } from 'chai';

// import {
//     ImpactMarketInstance,
//     CommunityInstance,
//     CUSDInstance,
//     CommunityFactoryInstance,
// } from '../../../types/truffle-contracts';
import { AccountsAddress, AccountsSigner, defineAccounts, defineSigners } from '../../helpers/accounts';
import {
    decimals,
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
import { ImpactMarket } from "../../../types/ImpactMarket";
import { CUSD } from "../../../types/CUSD";
import { Community } from "../../../types/Community";
import { CommunityFactory } from "../../../types/CommunityFactory";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
    expectRevert,
    expectEvent,
    time,
} = require('@openzeppelin/test-helpers');
should();

/** @test {Community} contract */
describe('Community - Claim', () => {
    // const {
    //     adminAccount1,
    //     communityManagerA,
    //     beneficiaryA,
    //     beneficiaryB,
    // } = defineAccounts(accounts);
    let accounts: AccountsAddress;
    let signers: AccountsSigner;
    // contract instances
    let impactMarketInstance: Contract & ImpactMarket;
    let communityInstance: Contract & Community;
    let communityFactoryInstance: Contract & CommunityFactory;
    let cUSDInstance: Contract & CUSD;

    beforeEach(async () => {
        accounts = await defineAccounts();
        signers = await defineSigners();
        //
        const ImpactMarketContract = await ethers.getContractFactory("ImpactMarket");
        const CommunityFactoryContract = await ethers.getContractFactory("CommunityFactory");
        const CommunityContract = await ethers.getContractFactory("Community");
        const cUSDContract = await ethers.getContractFactory("cUSD");
        //
        cUSDInstance = await cUSDContract.deploy() as Contract & CUSD;
        impactMarketInstance = await ImpactMarketContract.deploy(cUSDInstance.address, [
            accounts.adminAccount1,
        ]) as Contract & ImpactMarket;
        communityFactoryInstance = await CommunityFactoryContract.deploy(
            cUSDInstance.address,
            impactMarketInstance.address
        ) as Contract & CommunityFactory;
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
        communityInstance = await CommunityContract.attach(communityAddress) as Contract & Community;
        await cUSDInstance.testFakeFundAddress(communityAddress);
        await communityInstance.connect(signers.communityManagerA).addBeneficiary(accounts.beneficiaryA);
    });

    it('should not claim without belong to community', async () => {
        await expectRevert(
            communityInstance.connect(signers.beneficiaryB).claim(),
            'NOT_BENEFICIARY'
        );
    });

    it('should not claim after locked from community', async () => {
        await communityInstance.connect(signers.communityManagerA).lockBeneficiary(accounts.beneficiaryA);
        await expectRevert(
            communityInstance.connect(signers.beneficiaryA).claim(),
            'LOCKED'
        );
    });

    it('should not claim after removed from community', async () => {
        await communityInstance.connect(signers.communityManagerA).removeBeneficiary(accounts.beneficiaryA);
        await expectRevert(
            communityInstance.connect(signers.beneficiaryA).claim(),
            'REMOVED'
        );
    });

    it('should not claim if community is locked', async () => {
        const receipt = await communityInstance.connect(signers.communityManagerA).lock();
        // expectEvent(await receipt.wait(), 'CommunityLocked', {
        //     _by: accounts.communityManagerA,
        // });
        await expectRevert(
            communityInstance.connect(signers.beneficiaryA).claim(),
            'LOCKED'
        );
    });

    it('should not claim without waiting enough', async () => {
        const baseInterval = (
            await communityInstance.baseInterval()
        ).toNumber();
        const incrementInterval = (
            await communityInstance.incrementInterval()
        ).toNumber();
        await communityInstance.connect(signers.beneficiaryA).claim();
        await time.increase(time.duration.seconds(baseInterval + 5));
        await communityInstance.connect(signers.beneficiaryA).claim();
        await time.increase(time.duration.seconds(incrementInterval + 5));
        await expectRevert(
            communityInstance.connect(signers.beneficiaryA).claim(),
            'NOT_YET'
        );
        await time.increase(time.duration.seconds(incrementInterval + 5));
        await expectRevert(
            communityInstance.connect(signers.beneficiaryA).claim(),
            'NOT_YET'
        );
    });

    it('should claim after waiting', async () => {
        const baseInterval = (
            await communityInstance.baseInterval()
        ).toNumber();
        await time.increase(time.duration.seconds(baseInterval + 5));
        await communityInstance.connect(signers.beneficiaryA).claim();
        (await cUSDInstance.balanceOf(accounts.beneficiaryA))
            .toString()
            .should.be.equal(claimAmountTwo.plus(fiveCents).toString());
    });

    it('should not claim after max claim', async () => {
        const baseInterval = (
            await communityInstance.baseInterval()
        ).toNumber();
        const incrementInterval = (
            await communityInstance.incrementInterval()
        ).toNumber();
        const claimAmount = new BigNumber(
            (await communityInstance.claimAmount()).toString()
        )
            .div(decimals)
            .toNumber();
        const maxClaimAmount = new BigNumber(
            (await communityInstance.maxClaim()).toString()
        )
            .div(decimals)
            .toNumber();
        await communityInstance.connect(signers.beneficiaryA).claim();
        for (let index = 0; index < maxClaimAmount / claimAmount - 1; index++) {
            await time.increase(
                time.duration.seconds(
                    baseInterval + incrementInterval * index + 5
                )
            );
            await communityInstance.connect(signers.beneficiaryA).claim();
        }
        await time.increase(
            time.duration.seconds(
                baseInterval +
                incrementInterval * (maxClaimAmount / claimAmount) +
                5
            )
        );
        await expectRevert(
            communityInstance.connect(signers.beneficiaryA).claim(),
            'MAX_CLAIM'
        );
    });
});
