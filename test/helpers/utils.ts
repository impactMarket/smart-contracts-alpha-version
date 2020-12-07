import BigNumber from 'bignumber.js';
import { ContractReceipt, Event } from 'ethers';

export enum BeneficiaryState {
    NONE = '0',
    Valid = '1',
    Locked = '2',
    Removed = '3',
}

export function BNtoBigNumber(value: any) {
    return new BigNumber(value.toString());
}

export function filterEvent(
    tx: ContractReceipt,
    eventName: string
): Event | undefined {
    if (tx.events) {
        for (let index = 0; index < tx.events.length; index++) {
            const event = tx.events[index];
            if (event.event === eventName) {
                return event;
            }
        }
    }
    return undefined;
}
