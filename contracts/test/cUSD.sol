pragma solidity ^0.5.16;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";


contract cUSD is ERC20Mintable {
    constructor() MinterRole() public {
        //
    }

    function testFakeFundAddress(address _addr) public {
        mint(_addr, 500 * 10 ** 18);
    }
}