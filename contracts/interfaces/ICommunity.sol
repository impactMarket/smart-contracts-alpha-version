// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

interface ICommunity {
    function claimAmount() external view returns(uint256);
    function baseInterval() external view returns(uint256);
    function incrementInterval() external view returns(uint256);
    function maxClaim() external view returns(uint256);
}
