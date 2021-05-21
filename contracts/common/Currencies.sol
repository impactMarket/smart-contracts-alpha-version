// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

/**
 * @notice Welcome to Lottery contract.
 */
contract Currencies {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    // Declare a set state variable
    EnumerableSet.AddressSet private currency;
    mapping(address => address) public lendingPool;

    constructor() public {}

    function add(address _currency, address _lpCurrency) external {
        currency.add(_currency);
        lendingPool[_currency] = _lpCurrency;
    }

    function remove(address _currency) external {
        currency.remove(_currency);
        lendingPool[_currency] = address(0);
    }

    function length() external view returns (uint256) {
        return currency.length();
    }

    function at(uint256 _index) external view returns (address) {
        return currency.at(_index);
    }

    function onPool(address _currency) external view returns (address) {
        return lendingPool[_currency];
    }
}
