// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Community.sol";


/**
 * @notice Welcome to ImpactMarket, the main contract. This is an
 * administrative (for now) contract where the admins have control
 * over the list of communities. Being only able to add and
 * remoev communities
 */
contract ImpactMarket is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(address => bool) public communities;
    address private cUSDAddress;

    event CommunityAdded(
        address indexed _communityAddress,
        address indexed _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementalInterval
    );
    event CommunityRemoved(address indexed _communityAddress);

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
        uint256 _incrementalInterval
    ) external onlyAdmin {
        Community community = new Community(
            _firstManager,
            _claimAmount,
            _maxClaim,
            _baseInterval,
            _incrementalInterval,
            cUSDAddress
        );
        communities[address(community)] = true;
        emit CommunityAdded(
            address(community),
            _firstManager,
            _claimAmount,
            _maxClaim,
            _baseInterval,
            _incrementalInterval
        );
    }

    /**
     * @dev Remove an existing community. Can be used only by an admin.
     */
    function removeCommunity(address _community) external onlyAdmin {
        communities[_community] = false;
        emit CommunityRemoved(_community);
    }

    // function migrateCommunity(address _previousCommunity) public onlyAdmin {
    //     // TODO: to implement!
    // }

    function addAdmin(address _account) external onlyAdmin {
        grantRole(ADMIN_ROLE, _account);
    }

    function removeAdmin(address _account) external onlyAdmin {
        revokeRole(ADMIN_ROLE, _account);
    }

    // NOTES:

    // To get all the existing communities, go through
    // the CommunityAdded events.
}
