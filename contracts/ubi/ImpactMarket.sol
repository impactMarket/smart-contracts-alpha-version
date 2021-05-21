// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ICommunity.sol";
import "./interfaces/ICommunityFactory.sol";
import "./Community.sol";

/**
 * @notice Welcome to ImpactMarket, the main contract. This is an
 * administrative (for now) contract where the admins have control
 * over the list of communities. Being only able to add and
 * remove communities
 */
contract ImpactMarket is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(bytes32 => address[]) public pendingValidations;
    mapping(address => bool) public communities;
    address public cUSDAddress;
    address public communityFactory;
    uint256 public signaturesThreshold;

    event CommunityAdded(
        address indexed _communityAddress,
        address indexed _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    );
    event CommunityRemoved(address indexed _communityAddress);
    event CommunityMigrated(
        address indexed _firstManager,
        address indexed _communityAddress,
        address indexed _previousCommunityAddress
    );
    event CommunityFactoryChanged(address indexed _newCommunityFactory);

    /**
     * @dev It sets the first admin, which later can add others
     * and add/remove communities.
     */
    constructor(address _cUSDAddress, address[] memory _signatures) public {
        require(_signatures.length > 0, "NOT_VALID");
        _setupRole(ADMIN_ROLE, address(_signatures[0]));
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        cUSDAddress = _cUSDAddress;
        if (_signatures.length > 2) {
            signaturesThreshold = _signatures.length - 1;
        } else {
            signaturesThreshold = _signatures.length;
        }
        for (uint8 u = 1; u < _signatures.length; u += 1) {
            _setupRole(ADMIN_ROLE, address(_signatures[u]));
        }
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "NOT_ADMIN");
        _;
    }

    modifier validateRequest(bytes32 _type, bytes memory _packedParams) {
        bytes32 requestIdentifier = keccak256(
            abi.encodePacked(_type, _packedParams)
        );
        address[] memory validations = pendingValidations[requestIdentifier];
        for (uint8 u = 0; u < validations.length; u += 1) {
            require(validations[u] != msg.sender, "SIGNED");
        }
        // slither-disable-next-line controlled-array-length
        pendingValidations[requestIdentifier].push(msg.sender);
        uint256 totalValidations = pendingValidations[requestIdentifier].length;
        if (totalValidations == signaturesThreshold) {
            delete pendingValidations[requestIdentifier];
            _;
        }
    }

    /**
     * @dev Add a new community. Can be used only by an admin.
     * For further information regarding each parameter, see
     * *Community* smart contract constructor.
     */
    function addCommunity(
        address _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    )
        external
        onlyAdmin
        validateRequest(
            "addCommunity",
            abi.encodePacked(
                _firstManager,
                _claimAmount,
                _maxClaim,
                _baseInterval,
                _incrementInterval
            )
        )
    {
        address community = ICommunityFactory(communityFactory).deployCommunity(
            _firstManager,
            _claimAmount,
            _maxClaim,
            _baseInterval,
            _incrementInterval,
            address(0)
        );
        require(community != address(0), "NOT_VALID");
        communities[community] = true;
        emit CommunityAdded(
            community,
            _firstManager,
            _claimAmount,
            _maxClaim,
            _baseInterval,
            _incrementInterval
        );
    }

    /**
     * @dev Migrate community by deploying a new contract. Can be used only by an admin.
     * For further information regarding each parameter, see
     * *Community* smart contract constructor.
     */
    function migrateCommunity(
        address _firstManager,
        address _previousCommunityAddress,
        address _newCommunityFactory
    )
        external
        onlyAdmin
        validateRequest(
            "migrateCommunity",
            abi.encodePacked(_firstManager, _previousCommunityAddress)
        )
    {
        communities[_previousCommunityAddress] = false;
        require(address(_previousCommunityAddress) != address(0), "NOT_VALID");
        ICommunity previousCommunity = ICommunity(_previousCommunityAddress);
        address community = ICommunityFactory(_newCommunityFactory).deployCommunity(
            _firstManager,
            previousCommunity.claimAmount(),
            previousCommunity.maxClaim(),
            previousCommunity.baseInterval(),
            previousCommunity.incrementInterval(),
            _previousCommunityAddress
        );
        require(community != address(0), "NOT_VALID");
        previousCommunity.migrateFunds(community, _firstManager);
        communities[community] = true;
        emit CommunityMigrated(
            _firstManager,
            community,
            _previousCommunityAddress
        );
    }

    /**
     * @dev Remove an existing community. Can be used only by an admin.
     */
    function removeCommunity(address _community)
        external
        onlyAdmin
        validateRequest("removeCommunity", abi.encodePacked(_community))
    {
        communities[_community] = false;
        emit CommunityRemoved(_community);
    }

    /**
     * @dev Set the community factory address, if the contract is valid.
     */
    function setCommunityFactory(address _communityFactory)
        external
        onlyAdmin
        validateRequest(
            "setCommunityFactory",
            abi.encodePacked(_communityFactory)
        )
    {
        ICommunityFactory factory = ICommunityFactory(_communityFactory);
        require(factory.impactMarketAddress() == address(this), "NOT_ALLOWED");
        communityFactory = _communityFactory;
        emit CommunityFactoryChanged(_communityFactory);
    }

    /**
     * @dev Init community factory, used only at deploy time.
     */
    function initCommunityFactory(address _communityFactory)
        external
    {
        require(communityFactory == address(0), "");
        communityFactory = _communityFactory;
        emit CommunityFactoryChanged(_communityFactory);
    }

    /**
     * @dev Not allowed.
     */
    function grantRole(bytes32, address) public override {
        revert("NOT_ALLOWED");
    }

    /**
     * @dev Not allowed.
     */
    function revokeRole(bytes32, address) public override {
        revert("NOT_ALLOWED");
    }

    /**
     * @dev Not allowed.
     */
    function renounceRole(bytes32, address) public override {
        revert("NOT_ALLOWED");
    }
}
