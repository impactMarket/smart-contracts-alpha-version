// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

import "./Community.sol";
import "./interfaces/IImpactMarket.sol";

/**
 * @notice Welcome to CommunityFactory
 */
contract CommunityFactory {
    address private cUSDAddress;
    address private impactMarketAddress;

    constructor(address _cUSDAddress, address _impactMarketAddress) public {
        cUSDAddress = _cUSDAddress;
        impactMarketAddress = _impactMarketAddress;
    }

    modifier onlyImpactMarketAdmin() {
        require(
            IImpactMarket(impactMarketAddress).hasRole(
                keccak256("ADMIN_ROLE"),
                tx.origin
            ),
            "NOT_ADMIN"
        );
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
    ) external onlyImpactMarketAdmin returns (address) {
        require(msg.sender == impactMarketAddress, "");
        return
            address(
                new Community(
                    _firstManager,
                    _claimAmount,
                    _maxClaim,
                    _baseInterval,
                    _incrementInterval,
                    _previousCommunityAddress,
                    cUSDAddress
                )
            );
    }
}
