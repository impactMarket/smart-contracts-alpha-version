pragma solidity >=0.5.0 <0.7.0;

import "@openzeppelin/contracts/access/Roles.sol";
import "./WhitelistedCommunity.sol";


contract WhitelistedUser is WhitelistedCommunity {
    using Roles for Roles.Role;

    mapping(address => mapping(address => bool)) public userToCommunity;

    event WhitelistUserAdded(address indexed _account);
    event WhitelistUserRemoved(address indexed _account);

    Roles.Role private _whitelistUsers;

    constructor() internal WhitelistedCommunity() {}

    modifier onlyWhitelistUser() {
        require(
            isWhitelistUser(_msgSender()),
            "WhitelistUserRole: caller does not have the WhitelistUser role"
        );
        _;
    }

    function isWhitelistUser(address _account) public view returns (bool) {
        return _whitelistUsers.has(_account);
    }

    function isWhitelistUserInCommunity(address _account, address _community) public view returns (bool) {
        return userToCommunity[_account][_community];
    }

    function addWhitelistUser(address _account) public onlyWhitelistCommunity {
        userToCommunity[_account][msg.sender] = true;
        _addWhitelistUser(_account);
    }

    function renounceWhitelistUser() public {
        _removeWhitelistUser(_msgSender());
    }

    function _addWhitelistUser(address _account) internal {
        _whitelistUsers.add(_account);
        emit WhitelistUserAdded(_account);
    }

    function _removeWhitelistUser(address _account) internal {
        _whitelistUsers.remove(_account);
        emit WhitelistUserRemoved(_account);
    }
}
