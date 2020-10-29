import { ImpactMarketInstance, CommunityInstance, cUSDInstance, CommunityFactoryInstance } from '../../types/truffle-contracts';

const ImpactMarket = artifacts.require('./ImpactMarket.sol') as Truffle.Contract<ImpactMarketInstance>;
const Community = artifacts.require('./Community.sol') as Truffle.Contract<CommunityInstance>;
const CommunityFactory = artifacts.require('./CommunityFactory.sol') as Truffle.Contract<CommunityFactoryInstance>;
const cUSD = artifacts.require('./test/cUSD.sol') as Truffle.Contract<cUSDInstance>;

export {
    ImpactMarket,
    Community,
    CommunityFactory,
    cUSD
}