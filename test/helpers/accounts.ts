
export function defineAccounts(accounts: string[]) {
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
    }
}