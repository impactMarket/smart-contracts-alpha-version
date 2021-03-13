// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

/**
 * @notice Welcome to CommunitiesFund contract.
 */
contract CommunitiesFund {
    address public cUSDAddress;
    address public impactMarketAddress;

    mapping(address => bool) public locked;

    constructor(address _cUSDAddress, address _impactMarketAddress) public {
        cUSDAddress = _cUSDAddress;
        impactMarketAddress = _impactMarketAddress;
    }

    modifier onlyImpactMarket() {
        require(msg.sender == impactMarketAddress, "NOT_ALLOWED");
        _;
    }

    function lock(address _community) external onlyImpactMarket {
        loked[_community] = true;
    }

    function unlock(address _community) external onlyImpactMarket {
        loked[_community] = false;
    }

    function match(address[] _communities) external {
        bool availableFund = IERC20(_communities[0]).balanceOf(this);
        uint256 claimAmount = ICommunity(_communities[0]).claimAmount();
    }
}
