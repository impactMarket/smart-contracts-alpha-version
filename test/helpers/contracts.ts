/// <reference path="../../types/truffle-contracts/types.d.ts" />

import {
    ImpactMarketInstance,
    CommunityInstance,
    CUSDInstance,
    CommunityFactoryInstance,
} from '../../types/truffle-contracts';

const ImpactMarket = artifacts.require(
    'ImpactMarket'
) as Truffle.Contract<ImpactMarketInstance>;
const Community = artifacts.require('Community') as Truffle.Contract<
    CommunityInstance
>;
const CommunityFactory = artifacts.require(
    'CommunityFactory'
) as Truffle.Contract<CommunityFactoryInstance>;
const cUSD = artifacts.require('cUSD') as Truffle.Contract<
    CUSDInstance
>;

export { ImpactMarket, Community, CommunityFactory, cUSD };
