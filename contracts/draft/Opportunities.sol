// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;


/**
 * @notice Welcome to Opportunities contract.
 */
contract Opportunities {
    event NewOpportunity(
        uint256 id,
        uint256 min,
        uint256 max,
        uint256 target,
        uint256 pricePerUnit,
        uint256 initialFunding
    );
    event FundOpportunity(
        uint256 id,
        uint256 amount
    );
    event CheckpointOpportunity(
        uint256 id,
        uint256 units,
        address user
    );

    /**
     * @param min Minimun price per unit
     * @param max Maximun price per unit
     * @param target Number of units goal
     * @param current Number of units processed
     * @param pricePerUnit Price per unit
     */
    struct Opportunity {
        uint256 min;
        uint256 max;
        uint256 target;
        uint256 current;
        uint256 pricePerUnit;
    }
    
    uint256 public totalOpportunities = 0;
    mapping(uint256 => address) public opportunityBy;
    mapping(uint256 => Opportunity) public opportunities;

    /**
     * Only the opportunity creator
     */
    modifier onlyCreator(uint256 _id) {
        require(opportunityBy[_id] == msg.sender, "NOT_ALLOWED");
        _;
    }

    /**
     * @param _min Minimun price per unit
     * @param _max Maximun price per unit
     * @param _target Number of units goal
     * @param _initialFunding Initial amount of cUSD sent to fund
     */
    function add(
        uint256 _min,
        uint256 _max,
        uint256 _target,
        uint256 _initialFunding
    ) external {
        totalOpportunities = totalOpportunities + 1;
        opportunities[totalOpportunities] = Opportunity(
            _min,
            _max,
            _target,
            0,
            // TODO: verify if division respects minimun price per unit
            _initialFunding / _target
        );
        opportunityBy[totalOpportunities] = msg.sender;
        // TODO: tranfer cUSD using _initialFunding
        emit NewOpportunity(
            totalOpportunities,
            _min,
            _max,
            _target,
            _initialFunding / _target,
            _initialFunding
        );
    }

    // function remove() public {
    //     //
    // }

    function fund(uint256 _id, uint256 _amount) external {
        // Opportunity memory opportunity = opportunities[_id];
        // TODO: calculate new pricePerUnit
        // TODO: tranfer cUSD using _amount
        emit FundOpportunity(_id, _amount);
    }

    function checkpoint(uint256 _id, uint256 _units, address _user) external onlyCreator(_id) {
        Opportunity memory opportunity = opportunities[_id];
        // TODO: verify if the sum does not overflow
        opportunity.current = opportunity.current + _units;
        // TODO: tranfer cUSD to _user, using _units * pricePerUnit
        emit CheckpointOpportunity(_id, _units, _user);
    }
}
