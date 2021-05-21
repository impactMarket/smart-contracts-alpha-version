// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ICommunityFactory {
    function deployCommunity(
        address _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval,
        address _previousCommunityAddress
    ) external returns(address);
    function impactMarketAddress() external view returns(address);
}
