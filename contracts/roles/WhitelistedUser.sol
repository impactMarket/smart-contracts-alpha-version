pragma solidity >=0.5.0 <0.7.0;

import "@openzeppelin/contracts/access/Roles.sol";
import "./WhitelistedCommunity.sol";


contract WhitelistedUser is WhitelistedCommunity {
    using Roles for Roles.Role;

    event WhitelistUserAdded(address indexed account);
    event WhitelistUserRemoved(address indexed account);

    Roles.Role private _whitelistUsers;

    constructor() internal WhitelistedCommunity() {}

    modifier onlyWhitelistUser() {
        require(
            isWhitelistUser(_msgSender()),
            "WhitelistUserRole: caller does not have the WhitelistUser role"
        );
        _;
    }

    function isWhitelistUser(address account) public view returns (bool) {
        return _whitelistUsers.has(account);
    }

    function addWhitelistUser(address account) public onlyWhitelistCommunity {
        _addWhitelistUser(account);
    }

    function renounceWhitelistUser() public {
        _removeWhitelistUser(_msgSender());
    }

    function _addWhitelistUser(address account) internal {
        _whitelistUsers.add(account);
        emit WhitelistUserAdded(account);
    }

    function _removeWhitelistUser(address account) internal {
        _whitelistUsers.remove(account);
        emit WhitelistUserRemoved(account);
    }
}
