pragma solidity >=0.5.0 <0.7.0;

import "./roles/WhitelistedUser.sol";


contract ImpactMarket is WhitelistedUser {
    mapping(address => uint256) public cooldownClaim;
    uint256 cooldownTime = 1 minutes;

    constructor() public WhitelistedUser() {}

    function claim() public onlyWhitelistUser {
        require(_isReady(), "Not allowed yet!");
        _triggerCooldown();
    }

    function _triggerCooldown() internal {
        cooldownClaim[msg.sender] = uint256(block.timestamp + cooldownTime);
    }

    function _isReady() internal view returns (bool) {
        return (cooldownClaim[msg.sender] < block.timestamp ||
            cooldownClaim[msg.sender] == 0);
    }
}
