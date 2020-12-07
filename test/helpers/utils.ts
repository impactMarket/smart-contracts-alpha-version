import BigNumber from 'bignumber.js';
import { ContractReceipt, Event } from 'ethers';
import { expect } from 'chai';

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

// TODO: add eventArg confirmation
export function expectEvent(
    tx: ContractReceipt,
    eventName: string,
) {
    if (tx.events === undefined) {
        throw Error('No events found!');
    }
    const events = tx.events?.filter(e => e.event === eventName);
    expect(events.length > 0).to.equal(true, `No '${eventName}' events found`);
}
