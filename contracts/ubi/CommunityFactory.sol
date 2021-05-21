// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Community.sol";
import "./interfaces/IImpactMarket.sol";

/**
 * @notice Welcome to CommunityFactory
 */
contract CommunityFactory {
    address public cUSDAddress;
    address public impactMarketAddress;

    constructor(address _cUSDAddress, address _impactMarketAddress) {
        cUSDAddress = _cUSDAddress;
        impactMarketAddress = _impactMarketAddress;
    }

    modifier onlyImpactMarket() {
        require(msg.sender == impactMarketAddress, "NOT_ALLOWED");
        _;
    }

    /**
     * @dev Add a new community. Can be used only by an admin.
     * For further information regarding each parameter, see
     * *Community* smart contract constructor.
     */
    function deployCommunity(
        address _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval,
        address _previousCommunityAddress
    ) external onlyImpactMarket returns (address) {
        return
            address(
                new Community(
                    _firstManager,
                    _claimAmount,
                    _maxClaim,
                    _baseInterval,
                    _incrementInterval,
                    _previousCommunityAddress,
                    cUSDAddress,
                    cUSDAddress,
                    msg.sender
                )
            );
    }
}
