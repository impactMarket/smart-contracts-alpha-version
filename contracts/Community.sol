pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
 * @notice Welcome to the Community contract. For each community
 * there will be one contract like this being deployed by
 * ImpactMarket contract. This enable us to save tokens on the
 * contract itself, and avoid the problems of having everything
 * in one single contract. Each community has it's own members and
 * and coordinators.
 */
contract Community is AccessControl {
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    enum BeneficiaryState {NONE, Valid, Locked, Removed} // starts by 0 (when user is not added yet)

    mapping(address => uint256) public cooldown;
    mapping(address => uint256) public lastInterval;
    mapping(address => uint256) public claimed;
    mapping(address => BeneficiaryState) public beneficiaries;

    uint256 public amountByClaim;
    uint256 public baseIntervalTime;
    uint256 public incIntervalTime;
    uint256 public claimHardCap;

    address private cUSDAddress;

    event CoordinatorAdded(address indexed _account);
    event CoordinatorRemoved(address indexed _account);
    event BeneficiaryAdded(address indexed _account);
    event BeneficiaryLocked(address indexed _account);
    event BeneficiaryUnlocked(address indexed _account);
    event BeneficiaryRemoved(address indexed _account);
    event BeneficiaryClaim(address indexed _account, uint256 _amount);

    /**
     * @dev Constructor with custom fields, choosen by the community.
     * @param _firstCoordinator Comminuty's first coordinator. Will
     * be able to add others.
     * @param _amountByClaim Base amount to be claim by the benificiary.
     * @param _baseIntervalTime Base interval to start claiming.
     * @param _incIntervalTime Increment interval used in each claim.
     * @param _claimHardCap Limit that a beneficiary can claim at once.
     * @param _cUSDAddress cUSD smart contract address.
     */
    constructor(
        address _firstCoordinator,
        uint256 _amountByClaim,
        uint256 _baseIntervalTime,
        uint256 _incIntervalTime,
        uint256 _claimHardCap,
        address _cUSDAddress
    ) public {
        _setupRole(COORDINATOR_ROLE, _firstCoordinator);
        _setRoleAdmin(COORDINATOR_ROLE, COORDINATOR_ROLE);
        emit CoordinatorAdded(_firstCoordinator);

        amountByClaim = _amountByClaim;
        baseIntervalTime = _baseIntervalTime;
        incIntervalTime = _incIntervalTime;
        claimHardCap = _claimHardCap;

        cUSDAddress = _cUSDAddress;
    }

    modifier onlyValidBeneficiary() {
        require(beneficiaries[msg.sender] != BeneficiaryState.Locked, "LOCKED");
        require(
            beneficiaries[msg.sender] != BeneficiaryState.Removed,
            "REMOVED"
        );
        require(
            beneficiaries[msg.sender] == BeneficiaryState.Valid,
            "NOT_BENEFICIARY"
        );
        _;
    }

    modifier onlyCoordinators() {
        require(hasRole(COORDINATOR_ROLE, msg.sender), "NOT_COORDINATOR");
        _;
    }

    function isCoordinator(address _account) public view returns (bool) {
        return hasRole(COORDINATOR_ROLE, _account);
    }

    /**
     * @dev Allow community coordinators to add other coordinators.
     */
    function addCoordinator(address _account) public onlyCoordinators {
        grantRole(COORDINATOR_ROLE, _account);
        emit CoordinatorAdded(_account);
    }

    /**
     * @dev Allow community coordinators to remove other coordinators.
     */
    function removeCoordinator(address _account) public onlyCoordinators {
        revokeRole(COORDINATOR_ROLE, _account);
        emit CoordinatorRemoved(_account);
    }

    /**
     * @dev Allow community coordinators to add beneficiaries.
     */
    function addBeneficiary(address _account) public onlyCoordinators {
        beneficiaries[_account] = BeneficiaryState.Valid;
        cooldown[_account] = uint256(block.timestamp + baseIntervalTime);
        lastInterval[_account] = baseIntervalTime;
        emit BeneficiaryAdded(_account);
    }

    /**
     * @dev Allow community coordinators to lock beneficiaries.
     */
    function lockBeneficiary(address _account) public onlyCoordinators {
        require(beneficiaries[_account] == BeneficiaryState.Valid, "NOT_YET");
        beneficiaries[_account] = BeneficiaryState.Locked;
        emit BeneficiaryLocked(_account);
    }

    /**
     * @dev Allow community coordinators to unlock locked beneficiaries.
     */
    function unlockBeneficiary(address _account) public onlyCoordinators {
        require(beneficiaries[_account] == BeneficiaryState.Locked, "NOT_YET");
        beneficiaries[_account] = BeneficiaryState.Valid;
        emit BeneficiaryUnlocked(_account);
    }

    /**
     * @dev Allow community coordinators to add beneficiaries.
     */
    function removeBeneficiary(address _account) public onlyCoordinators {
        beneficiaries[_account] = BeneficiaryState.Removed;
        emit BeneficiaryRemoved(_account);
    }

    /**
     * @dev Allow beneficiaries to claim.
     */
    function claim() public onlyValidBeneficiary {
        require(
            cooldown[msg.sender] < block.timestamp ||
                cooldown[msg.sender] == 0,
            "NOT_YET"
        );
        require((claimed[msg.sender] + amountByClaim) <= claimHardCap, "MAX_CLAIM");
        IERC20(cUSDAddress).transfer(msg.sender, amountByClaim);
        claimed[msg.sender] = claimed[msg.sender] + amountByClaim;
        lastInterval[msg.sender] = lastInterval[msg.sender] + incIntervalTime;
        cooldown[msg.sender] = uint256(block.timestamp + lastInterval[msg.sender]);
        emit BeneficiaryClaim(msg.sender, amountByClaim);
    }
}
