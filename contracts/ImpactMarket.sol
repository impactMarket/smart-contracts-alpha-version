pragma solidity >=0.5.0 <0.7.0;

import "./WhitelistedCommunity.sol";


contract ImpactMarket is WhitelistedCommunity {
    mapping(address => uint256) public cooldownClaim;

    constructor() public WhitelistedCommunity() {}

    modifier onlyUserInAnyCommunity() {
        require(isUserInAnyCommunity(msg.sender), "Not in a community!");
        _;
    }

    function addUser(address _account) public onlyWhitelistCommunity {
        userToCommunity[_account] = msg.sender;
        cooldownClaim[_account] = uint256(
            block.timestamp + commnitiesClaim[msg.sender].baseIntervalTime
        );
    }

    function claim() public onlyUserInAnyCommunity {
        require(_isReady(), "Not allowed yet!");
        _triggerCooldown();
    }

    function _triggerCooldown() internal {
        uint256 cooldownTime = commnitiesClaim[userToCommunity[msg.sender]]
            .incIntervalTime;
        cooldownClaim[msg.sender] = uint256(block.timestamp + cooldownTime);
    }

    function _isReady() internal view returns (bool) {
        return (cooldownClaim[msg.sender] < block.timestamp ||
            cooldownClaim[msg.sender] == 0);
    }
}
