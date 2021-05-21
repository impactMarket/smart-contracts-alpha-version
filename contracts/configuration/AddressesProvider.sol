// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @notice Welcome to AddressesProvider contract.
 */
contract AddressesProvider {
    mapping(bytes32 => address) private addresses;

    // existing keys
    // IMPACT_MARKET
    // COMMUNITY_FACTORY
    // CURRENCIES
    // POOL_ADDRESSES_PROVIDER

    function getAddress(bytes32 _key) public view returns (address) {
        return addresses[_key];
    }

    function setAddress(bytes32 _key, address _value) public {
        addresses[_key] = _value;
    }
}
