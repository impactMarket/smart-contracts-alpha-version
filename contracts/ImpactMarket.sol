pragma solidity ^0.5.16;

import "@openzeppelin/contracts/access/roles/WhitelistAdminRole.sol";
import "./Community.sol";


/**
 * @notice Welcome to ImpactMarket, the main contract. This is an
 * administrative (for now) contract where the admins have control
 * over the list of communities. Being only able to add and
 * remoev communities
 */
contract ImpactMarket is WhitelistAdminRole {
    mapping(address => bool) public communities;
    address private cUSDAddress;

    event CommunityAdded(address indexed _addr);
    event CommunityRemoved(address indexed _addr);

    /**
     * @dev Constructor only with the cUSD contract address. It
     * also sets the first admin, which later can add others
     * and add/remove communities.
     * @param _cUSDAddress cUSD smart contract address.
     */
    constructor(address _cUSDAddress) public WhitelistAdminRole() {
        cUSDAddress = _cUSDAddress;
    }

    /**
     * @dev Add a new community. Can be used only by an admin.
     * For further information regarding each parameter, see
     * *Community* smart contract constructor.
     */
    function addCommunity(
        address _firstCoordinator,
        uint256 _amountByClaim,
        uint256 _baseIntervalTime,
        uint256 _incIntervalTime,
        uint256 _claimHardCap
    ) public onlyWhitelistAdmin {
        Community community = new Community(
            _firstCoordinator,
            _amountByClaim,
            _baseIntervalTime,
            _incIntervalTime,
            _claimHardCap,
            cUSDAddress
        );
        communities[address(community)] = true;
        emit CommunityAdded(address(community));
    }

    /**
     * @dev Remove an existing community. Can be used only by an admin.
     */
    function removeCommunity(address _community) public onlyWhitelistAdmin {
        communities[_community] = false;
        emit CommunityRemoved(_community);
    }

    // NOTES:

    // To get all the existing communities, go through
    // the CommunityAdded events.
}
