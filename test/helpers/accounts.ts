import { Signer } from 'ethers';
import { ethers } from 'hardhat';

export interface AccountsAddress {
    adminAccount1: string;
    adminAccount2: string;
    adminAccount3: string;
    communityManagerA: string;
    communityManagerB: string;
    communityManagerC: string;
    beneficiaryA: string;
    beneficiaryB: string;
    beneficiaryC: string;
    beneficiaryD: string;
}

export async function defineAccounts(): Promise<AccountsAddress> {
    const accounts = await ethers.provider.listAccounts();

    const adminAccount1 = accounts[0];
    const adminAccount2 = accounts[1];
    const adminAccount3 = accounts[2];
    // community managers
    const communityManagerA = accounts[3];
    const communityManagerB = accounts[4];
    const communityManagerC = accounts[5];
    // beneficiaries
    const beneficiaryA = accounts[6];
    const beneficiaryB = accounts[7];
    const beneficiaryC = accounts[8];
    const beneficiaryD = accounts[9];

    return {
        adminAccount1,
        adminAccount2,
        adminAccount3,
        // community managers
        communityManagerA,
        communityManagerB,
        communityManagerC,
        // beneficiaries
        beneficiaryA,
        beneficiaryB,
        beneficiaryC,
        beneficiaryD,
    };
}

export interface AccountsSigner {
    adminAccount1: Signer;
    adminAccount2: Signer;
    adminAccount3: Signer;
    communityManagerA: Signer;
    communityManagerB: Signer;
    communityManagerC: Signer;
    beneficiaryA: Signer;
    beneficiaryB: Signer;
    beneficiaryC: Signer;
    beneficiaryD: Signer;
}
export async function defineSigners(): Promise<AccountsSigner> {
    const accounts = await ethers.getSigners();

    const adminAccount1 = accounts[0];
    const adminAccount2 = accounts[1];
    const adminAccount3 = accounts[2];
    // community managers
    const communityManagerA = accounts[3];
    const communityManagerB = accounts[4];
    const communityManagerC = accounts[5];
    // beneficiaries
    const beneficiaryA = accounts[6];
    const beneficiaryB = accounts[7];
    const beneficiaryC = accounts[8];
    const beneficiaryD = accounts[9];

    return {
        adminAccount1,
        adminAccount2,
        adminAccount3,
        // community managers
        communityManagerA,
        communityManagerB,
        communityManagerC,
        // beneficiaries
        beneficiaryA,
        beneficiaryB,
        beneficiaryC,
        beneficiaryD,
    };
}
