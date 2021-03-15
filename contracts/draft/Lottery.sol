// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Welcome to Lottery contract.
 */
contract Lottery {
    address public cUSDAddress;
    mapping(address => uint256) public tickets;

    constructor(
    ) public {
    }

    function buy(uint256 _tickets) external {
        //
    }

    function raffle() external {
        //
    }
}
