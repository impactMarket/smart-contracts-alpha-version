// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ICommunity.sol";
import "./interfaces/ICommunityFactory.sol";
import "./Community.sol";

/**
 * @notice Welcome to ImpactMarket, the main contract. This is an
 * administrative (for now) contract where the admins have control
 * over the list of communities. Being only able to add and
 * remoev communities
 */
// TODO: implementr interface
contract ImpactMarket is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(address => bool) public communities;
    address private cUSDAddress;
    address private communityFactory;

    event CommunityAdded(
        address indexed _communityAddress,
        address indexed _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    );
    event CommunityRemoved(address indexed _communityAddress);
    event CommunityMigrated(
        address indexed _firstManager,
        address indexed _communityAddress,
        address indexed _previousCommunityAddress
    );

    /**
     * @dev Constructor only with the cUSD contract address. It
     * also sets the first admin, which later can add others
     * and add/remove communities.
     * @param _cUSDAddress cUSD smart contract address.
     */
    constructor(address _cUSDAddress) public {
        _setupRole(ADMIN_ROLE, msg.sender);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        cUSDAddress = _cUSDAddress;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "NOT_ADMIN");
        _;
    }

    /**
     * @dev Add a new community. Can be used only by an admin.
     * For further information regarding each parameter, see
     * *Community* smart contract constructor.
     */
    function addCommunity(
        address _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    ) external onlyAdmin {
        address community = ICommunityFactory(communityFactory).deployCommunity(
            _firstManager,
            _claimAmount,
            _maxClaim,
            _baseInterval,
            _incrementInterval,
            address(0)
        );
        communities[community] = true;
        emit CommunityAdded(
            community,
            _firstManager,
            _claimAmount,
            _maxClaim,
            _baseInterval,
            _incrementInterval
        );
    }

    function migrateCommunity(
        address _firstManager,
        address _previousCommunityAddress
    ) external onlyAdmin {
        ICommunity previousCommunity = ICommunity(_previousCommunityAddress);
        address community = ICommunityFactory(communityFactory).deployCommunity(
            _firstManager,
            previousCommunity.claimAmount(),
            previousCommunity.maxClaim(),
            previousCommunity.baseInterval(),
            previousCommunity.incrementInterval(),
            _previousCommunityAddress
        );
        communities[_previousCommunityAddress] = false;
        communities[community] = true;
        emit CommunityMigrated(
            _firstManager,
            community,
            _previousCommunityAddress
        );
    }

    /**
     * @dev Remove an existing community. Can be used only by an admin.
     */
    function removeCommunity(address _community) external onlyAdmin {
        communities[_community] = false;
        emit CommunityRemoved(_community);
    }

    function addAdmin(address _account) external onlyAdmin {
        grantRole(ADMIN_ROLE, _account);
    }

    function removeAdmin(address _account) external onlyAdmin {
        revokeRole(ADMIN_ROLE, _account);
    }

    function setCommunityFactory(address _communityFactory) external onlyAdmin {
        communityFactory = _communityFactory;
    }
}
