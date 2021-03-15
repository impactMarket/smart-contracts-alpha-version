// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Welcome to CommunitiesFund contract.
 */
contract CommunitiesFund {
    bool public open;
    uint256 public round;
    uint256 public until;
    address public cUSDAddress;
    address public impactMarketAddress;

    mapping(uint256 => uint256) public roundAmount;
    mapping(uint256 => uint256) public roundMatchPool;
    mapping(uint256 => mapping(address => uint256)) public communitiesAmount;

    constructor(
        address _cUSDAddress,
        address _impactMarketAddress
    ) public {
        open = false;
        round = 0;
        cUSDAddress = _cUSDAddress;
        impactMarketAddress = _impactMarketAddress;
    }

    function startRound(uint256 _until) external {
        until = _until;
        round ++;
    }

    function close() external {
        // solhint-disable-next-line not-rely-on-time
        require(block.timestamp >= until, "NOT_YET");
        roundMatchPool[round] = IERC20(cUSDAddress).balanceOf(address(this));
        open = false;
    }

    function immidiateClose() external {
        open = false;
    }

    function claim() external {
        //
    }

    function contribute(address[] calldata _community, uint256[] calldata _amount) external {
        // TODO: prevent contribute from community members
        require(open == true, "CLOSED");
        // solhint-disable-next-line not-rely-on-time
        require(block.timestamp <= until, "NOT_YET");
        require(_community.length == _amount.length, "NOT_EQUAL");
        IERC20 cusd = IERC20(cUSDAddress);
        for(uint256 c = 0; c < _community.length; c++) {
            communitiesAmount[round][_community[c]] += _amount[c];
            roundAmount[round] += _amount[c];
            bool success = cusd.transfer(_community[c], _amount[c]);
            require(success, "NO_FUNDS");
        }
    }

    function setImpactMarket(address _impactMarket) external {
        //
    }
}
