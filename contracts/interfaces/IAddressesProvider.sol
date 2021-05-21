// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface IAddressesProvider {
    function getAddress(bytes32 _key) external view returns (address);
}
