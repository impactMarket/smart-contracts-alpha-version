pragma solidity ^0.5.16;

import "@openzeppelin/contracts/access/Roles.sol";
import "@openzeppelin/contracts/access/roles/WhitelistAdminRole.sol";


contract WhitelistedCommunity is WhitelistAdminRole {
    using Roles for Roles.Role;

    struct CommunityClaim {
        uint256 amountByClaim;
        uint256 baseIntervalTime;
        uint256 incIntervalTime;
        uint256 claimHardCap;
    }

    mapping(address => CommunityClaim) public commnitiesClaim;
    mapping(address => address) public userToCommunity;

    event WhitelistCommunityAdded(address indexed _account);
    event WhitelistCommunityRemoved(address indexed _account);

    Roles.Role private _whitelistCommunitys;

    constructor() internal WhitelistAdminRole() {}

    modifier onlyWhitelistCommunity() {
        require(
            isWhitelistCommunity(_msgSender()),
            "WhitelistCommunityRole: caller does not have the WhitelistCommunity role"
        );
        _;
    }

    function isWhitelistCommunity(address _account) public view returns (bool) {
        return _whitelistCommunitys.has(_account);
    }

    function addWhitelistCommunity(
        address _account,
        uint256 _amountByClaim,
        uint256 _baseIntervalTime,
        uint256 _incIntervalTime,
        uint256 _claimHardCap
    ) public onlyWhitelistAdmin {
        CommunityClaim memory commnityClaim = CommunityClaim(
            _amountByClaim,
            _baseIntervalTime,
            _incIntervalTime,
            _claimHardCap
        );
        commnitiesClaim[_account] = commnityClaim;
        _addWhitelistCommunity(_account);
    }

    function renounceWhitelistCommunity() public {
        _removeWhitelistCommunity(_msgSender());
    }

    function isUserInAnyCommunity(address _account) public view returns (bool) {
        return userToCommunity[_account] != address(0);
    }

    function isUserInCommunity(address _account, address _community)
        public
        view
        returns (bool)
    {
        return userToCommunity[_account] == _community;
    }

    function renounce() public {
        userToCommunity[msg.sender] = address(0);
    }

    function removeUser(address _account) public onlyWhitelistCommunity {
        userToCommunity[_account] = address(0);
    }

    function removeWhitelistCommunity(address _community) public onlyWhitelistAdmin {
        delete commnitiesClaim[_community];
    }

    function _addWhitelistCommunity(address _account) internal {
        _whitelistCommunitys.add(_account);
        emit WhitelistCommunityAdded(_account);
    }

    function _removeWhitelistCommunity(address _account) internal {
        _whitelistCommunitys.remove(_account);
        emit WhitelistCommunityRemoved(_account);
    }

    // NOTES:

    // To get all the existing communities, go through
    // the WhitelistCommunityAdded events.
}
