import {
    ImpactMarketInstance,
    CommunityInstance,
    CUsdInstance,
    CommunityFactoryInstance,
} from '../../types/contracts/truffle';

const ImpactMarket = artifacts.require(
    './ImpactMarket.sol'
) as Truffle.Contract<ImpactMarketInstance>;
const Community = artifacts.require('./Community.sol') as Truffle.Contract<
    CommunityInstance
>;
const CommunityFactory = artifacts.require(
    './CommunityFactory.sol'
) as Truffle.Contract<CommunityFactoryInstance>;
const cUSD = artifacts.require('./test/cUSD.sol') as Truffle.Contract<
    CUsdInstance
>;

export { ImpactMarket, Community, CommunityFactory, cUSD };
