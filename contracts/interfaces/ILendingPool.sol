// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ILendingPool {
    function redeemUnderlying(
        address _reserve,
        address payable _user,
        uint256 _amount,
        uint256 _aTokenBalanceAfterRedeem
    ) external;

    function deposit(
        address _reserve,
        uint256 _amount,
        uint16 _referralCode
    ) external payable;
}
