import BigNumber from 'bignumber.js';

export enum BeneficiaryState {
    NONE = '0',
    Valid = '1',
    Locked = '2',
    Removed = '3',
}

export function BNtoBigNumber(value: any) {
    return new BigNumber(value.toString());
}
