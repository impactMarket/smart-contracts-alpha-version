// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Welcome to Arte contract.
 */
contract Arte is ERC1155 {
    address public cUSDAddress;

    // arteId -> is open to auctions
    mapping(uint256 => bool) public openToAuctions;
    // arteId -> selling price
    mapping(uint256 => uint256) public sellPrice;
    // arteId -> address -> number os bids
    mapping(uint256 => mapping(address => uint256)) public arteBids;
    // arteId -> bidId -> value of the bid
    mapping(uint256 => mapping(uint256 => uint256)) public arteBidValue;
    // arteId -> bidId -> author of the bid
    mapping(uint256 => mapping(uint256 => address)) public arteBidAuthor;

    constructor(address _cUSDAddress, string memory _uri) public ERC1155(_uri) {
        cUSDAddress = _cUSDAddress;
    }

    function bid(uint256 _arteId, uint256 _value) external {
        require(openToAuctions[_arteId] == true, "NOT_OPEN");
        uint256 bidId = arteBids[_arteId][msg.sender];
        arteBidValue[_arteId][bidId] = _value;
        arteBidAuthor[_arteId][bidId] = msg.sender;
        arteBids[_arteId][msg.sender] ++;
        // transfer cusd amount to this contract
        bool success = IERC20(cUSDAddress).transferFrom(
            msg.sender,
            address(this),
            _value
        );
        require(success, "NO_FUNDS");
    }

    function accept(uint256 _arteId, uint256 _bidId) external {
        require(arteBidValue[_arteId][_bidId] > 0, "NOT_ENOUGH");
        arteBidValue[_arteId][_bidId] = 0;
        // transfer arte
        safeTransferFrom(
            msg.sender,
            arteBidAuthor[_arteId][_bidId],
            _arteId,
            balanceOf(msg.sender, _arteId),
            ""
        );
        // transfer cusd
        bool success = IERC20(cUSDAddress).transfer(
            msg.sender,
            arteBidValue[_arteId][_bidId]
        );
        require(success, "NO_FUNDS");
    }

    function withdraw(uint256 _arteId, uint256 _bidId) external {
        require(arteBidAuthor[_arteId][_bidId] == msg.sender, "NOT_YOU");
        require(arteBidValue[_arteId][_bidId] > 0, "NOT_ENOUGH");
        arteBidAuthor[_arteId][_bidId] = address(0);
        arteBidValue[_arteId][_bidId] = 0;
        // transfer cusd
        bool success = IERC20(cUSDAddress).transfer(
            msg.sender,
            arteBidValue[_arteId][_bidId]
        );
        require(success, "NO_FUNDS");
    }

    function setAuctionsAcceptance(uint256 _arteId, bool _isOpen) external {
        require(balanceOf(msg.sender, _arteId) > 0, "NOT_ENOUGH");
        openToAuctions[_arteId] = _isOpen;
    }

    function setSellingPrice(uint256 _arteId, uint256 _sellPrice) external {
        require(balanceOf(msg.sender, _arteId) > 0, "NOT_ENOUGH");
        sellPrice[_arteId] = _sellPrice;
    }

    function buy(
        address _from,
        uint256 _arteId
    ) external {
        require(sellPrice[_arteId] > 0, "NOT_ENOUGH");
        uint256 price = sellPrice[_arteId];
        sellPrice[_arteId] = 0;
        safeTransferFrom(
            _from,
            msg.sender,
            _arteId,
            balanceOf(_from, _arteId),
            ""
        );
        bool success = IERC20(cUSDAddress).transferFrom(
            msg.sender,
            _from,
            price
        );
        require(success, "NO_FUNDS");
    }

    function create(
        uint256 _arteId,
        uint256 _amount,
        bytes calldata _data,
        bool _openToAuctions,
        uint256 _sellPrice
    ) external {
        _mint(msg.sender, _arteId, _amount, _data);
        openToAuctions[_arteId] = _openToAuctions;
        sellPrice[_arteId] = _sellPrice;
    }
}
