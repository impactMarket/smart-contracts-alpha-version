pragma solidity >=0.5.0 <0.7.0;

import "@openzeppelin/contracts/access/Roles.sol";
import "@openzeppelin/contracts/access/roles/WhitelistAdminRole.sol";


contract WhitelistedCommunity is WhitelistAdminRole {
    using Roles for Roles.Role;

    event WhitelistCommunityAdded(address indexed account);
    event WhitelistCommunityRemoved(address indexed account);

    Roles.Role private _whitelistCommunitys;

    constructor() internal WhitelistAdminRole() {}

    modifier onlyWhitelistCommunity() {
        require(
            isWhitelistCommunity(_msgSender()),
            "WhitelistCommunityRole: caller does not have the WhitelistCommunity role"
        );
        _;
    }

    function isWhitelistCommunity(address account) public view returns (bool) {
        return _whitelistCommunitys.has(account);
    }

    function addWhitelistCommunity(address account) public onlyWhitelistAdmin {
        _addWhitelistCommunity(account);
    }

    function renounceWhitelistCommunity() public {
        _removeWhitelistCommunity(_msgSender());
    }

    function _addWhitelistCommunity(address account) internal {
        _whitelistCommunitys.add(account);
        emit WhitelistCommunityAdded(account);
    }

    function _removeWhitelistCommunity(address account) internal {
        _whitelistCommunitys.remove(account);
        emit WhitelistCommunityRemoved(account);
    }
}
