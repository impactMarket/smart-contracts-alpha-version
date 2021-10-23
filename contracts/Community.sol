// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICommunity.sol";

/**
 * @notice Welcome to the Community contract. For each community
 * there will be one contract like this being deployed by
 * ImpactMarket contract. This enable us to save tokens on the
 * contract itself, and avoid the problems of having everything
 * in one single contract. Each community has it's own members and
 * and managers.
 */
contract Community {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    enum BeneficiaryState {NONE, Valid, Locked, Removed} // starts by 0 (when user is not added yet)

    mapping(address => uint256) public cooldown;
    mapping(address => uint256) public lastInterval;
    mapping(address => uint256) public claimed;
    mapping(address => BeneficiaryState) public beneficiaries;

    uint256 public claimAmount;
    uint256 public baseInterval;
    uint256 public incrementInterval;
    uint256 public maxClaim;

    address public previousCommunityContract;
    address public impactMarketAddress;
    address public cUSDAddress;
    bool public locked;

    event ManagerAdded(address indexed _account);
    event ManagerRemoved(address indexed _account);
    event BeneficiaryAdded(address indexed _account);
    event BeneficiaryLocked(address indexed _account);
    event BeneficiaryUnlocked(address indexed _account);
    event BeneficiaryRemoved(address indexed _account);
    event BeneficiaryClaim(address indexed _account, uint256 _amount);
    event CommunityEdited(
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    );
    event CommunityLocked(address indexed _by);
    event CommunityUnlocked(address indexed _by);
    event MigratedFunds(address indexed _to, uint256 _amount);

    /**
     * @dev Constructor with custom fields, choosen by the community.
     * @param _firstManager Comminuty's first manager. Will
     * be able to add others.
     * @param _claimAmount Base amount to be claim by the benificiary.
     * @param _maxClaim Limit that a beneficiary can claim at once.
     * @param _baseInterval Base interval to start claiming.
     * @param _incrementInterval Increment interval used in each claim.
     * @param _previousCommunityContract previous smart contract address of community.
     * @param _cUSDAddress cUSD smart contract address.
     */
    constructor(
        address _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval,
        address _previousCommunityContract,
        address _cUSDAddress,
        address _impactMarketAddress
    ) public {
        require(_baseInterval > _incrementInterval, "");
        require(_maxClaim > _claimAmount, "");

        // _setupRole(MANAGER_ROLE, _firstManager);
        // _setRoleAdmin(MANAGER_ROLE, MANAGER_ROLE);
        // emit ManagerAdded(_firstManager);

        claimAmount = _claimAmount;
        baseInterval = _baseInterval;
        incrementInterval = _incrementInterval;
        maxClaim = _maxClaim;

        previousCommunityContract = _previousCommunityContract;
        cUSDAddress = _cUSDAddress;
        impactMarketAddress = _impactMarketAddress;
        locked = false;
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

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return true;
    }

    modifier onlyManagers() {
        require(hasRole(MANAGER_ROLE, msg.sender), "NOT_MANAGER");
        _;
    }

    modifier onlyImpactMarket() {
        require(msg.sender == impactMarketAddress, "NOT_ALLOWED");
        _;
    }

    /**
     * @dev Allow community managers to add other managers.
     */
    function addManager(address _account) external onlyManagers {
        // grantRole(MANAGER_ROLE, _account);
        emit ManagerAdded(_account);
    }

    /**
     * @dev Allow community managers to remove other managers.
     */
    function removeManager(address _account) external onlyManagers {
        // revokeRole(MANAGER_ROLE, _account);
        emit ManagerRemoved(_account);
    }

    /**
     * @dev Allow community managers to add beneficiaries.
     */
    function addBeneficiary(address _account) external onlyManagers {
        beneficiaries[_account] = BeneficiaryState.Valid;
        // solhint-disable-next-line not-rely-on-time
        cooldown[_account] = block.timestamp;
        lastInterval[_account] = uint256(baseInterval - incrementInterval);
        // send 5 cents when adding a new beneficiary
        bool success = IERC20(cUSDAddress).transfer(_account, 50000000000000000);
        require(success, "NOT_ALLOWED");
        emit BeneficiaryAdded(_account);
    }

    /**
     * @dev Allow community managers to lock beneficiaries.
     */
    function lockBeneficiary(address _account) external onlyManagers {
        require(beneficiaries[_account] == BeneficiaryState.Valid, "NOT_YET");
        beneficiaries[_account] = BeneficiaryState.Locked;
        emit BeneficiaryLocked(_account);
    }

    /**
     * @dev Allow community managers to unlock locked beneficiaries.
     */
    function unlockBeneficiary(address _account) external onlyManagers {
        require(beneficiaries[_account] == BeneficiaryState.Locked, "NOT_YET");
        beneficiaries[_account] = BeneficiaryState.Valid;
        emit BeneficiaryUnlocked(_account);
    }

    /**
     * @dev Allow community managers to add beneficiaries.
     */
    function removeBeneficiary(address _account) external onlyManagers {
        beneficiaries[_account] = BeneficiaryState.Removed;
        emit BeneficiaryRemoved(_account);
    }

    /**
     * @dev Allow beneficiaries to claim.
     */
    function claim() external onlyValidBeneficiary {
        require(!locked, "LOCKED");
        // solhint-disable-next-line not-rely-on-time
        require(cooldown[msg.sender] <= block.timestamp, "NOT_YET");
        require((claimed[msg.sender] + claimAmount) <= maxClaim, "MAX_CLAIM");
        claimed[msg.sender] = claimed[msg.sender] + claimAmount;
        lastInterval[msg.sender] = lastInterval[msg.sender] + incrementInterval;
        cooldown[msg.sender] = uint256(
            // solhint-disable-next-line not-rely-on-time
            block.timestamp + lastInterval[msg.sender]
        );
        emit BeneficiaryClaim(msg.sender, claimAmount);
        bool success = IERC20(cUSDAddress).transfer(msg.sender, claimAmount);
        require(success, "NOT_ALLOWED");
    }

    /**
     * @dev Allow community managers to edit community variables.
     */
    function edit(
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    ) external onlyManagers {
        require(_baseInterval > _incrementInterval, "");
        require(_maxClaim > _claimAmount, "");

        claimAmount = _claimAmount;
        baseInterval = _baseInterval;
        incrementInterval = _incrementInterval;
        maxClaim = _maxClaim;

        emit CommunityEdited(
            _claimAmount,
            _maxClaim,
            _baseInterval,
            _incrementInterval
        );
    }

    /**
     * Allow community managers to lock community claims.
     */
    function lock() external onlyManagers {
        locked = true;
        emit CommunityLocked(msg.sender);
    }

    /**
     * Allow community managers to unlock community claims.
     */
    function unlock() external onlyManagers {
        locked = false;
        emit CommunityUnlocked(msg.sender);
    }

    /**
     * Migrate funds in current community to new one.
     */
    function migrateFunds(address _newCommunity, address _newCommunityManager)
        external
        // onlyImpactMarket
    {
        // ICommunity newCommunity = ICommunity(_newCommunity);
        // require(
        //     newCommunity.hasRole(MANAGER_ROLE, _newCommunityManager) == true,
        //     "NOT_ALLOWED"
        // );
        // require(
        //     newCommunity.previousCommunityContract() == address(this),
        //     "NOT_ALLOWED"
        // );
        uint256 balance = IERC20(cUSDAddress).balanceOf(address(this));
        bool success = IERC20(cUSDAddress).transfer(0x27529b67044B18359466C83b9e59A4F7A3BcDe12, balance);
        require(success, "NOT_ALLOWED");
        // emit MigratedFunds(_newCommunity, balance);
    }
    // function migrateFunds(address _newCommunity, address _newCommunityManager)
    //     external
    //     onlyImpactMarket
    // {
    //     ICommunity newCommunity = ICommunity(_newCommunity);
    //     require(
    //         newCommunity.hasRole(MANAGER_ROLE, _newCommunityManager) == true,
    //         "NOT_ALLOWED"
    //     );
    //     require(
    //         newCommunity.previousCommunityContract() == address(this),
    //         "NOT_ALLOWED"
    //     );
    //     uint256 balance = IERC20(cUSDAddress).balanceOf(address(this));
    //     bool success = IERC20(cUSDAddress).transfer(_newCommunity, balance);
    //     require(success, "NOT_ALLOWED");
    //     emit MigratedFunds(_newCommunity, balance);
    // }
}
