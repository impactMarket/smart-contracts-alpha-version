// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ICommunity {
    function cooldown(address beneficiary) external view returns(uint256);
    function lastInterval(address beneficiary) external view returns(uint256);
    function claimed(address beneficiary) external view returns(uint256);
    function beneficiaries(address beneficiary) external view returns(uint256);

    function claimAmount() external view returns(uint256);
    function baseInterval() external view returns(uint256);
    function incrementInterval() external view returns(uint256);
    function maxClaim() external view returns(uint256);
    function previousCommunityContract() external view returns(address);
    function hasRole(bytes32 role, address account) external view returns(bool);
    function migrateFunds(address _newCommunity, address _newCommunityManager) external;
}
