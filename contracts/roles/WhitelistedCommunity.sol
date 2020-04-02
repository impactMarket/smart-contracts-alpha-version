pragma solidity >=0.5.0 <0.7.0;

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
