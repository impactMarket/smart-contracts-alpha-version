import BigNumber from 'bignumber.js';

const { time } = require('@openzeppelin/test-helpers');

// constants
const decimals = new BigNumber(10).pow(18);
const hour = time.duration.hours(1);
const day = time.duration.days(1);
const week = time.duration.weeks(1);
// const month = time.duration.days(30);
const claimAmountTwo = new BigNumber('2').multipliedBy(decimals);
const maxClaimTen = new BigNumber('10').multipliedBy(decimals);
const fiveCents = new BigNumber('50000000000000000');

export { decimals, hour, day, week, claimAmountTwo, maxClaimTen, fiveCents };
