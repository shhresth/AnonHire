// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DIDRegistry
 * @dev Decentralized Identifier (DID) Registry for managing identity mappings
 * @notice Stores DIDs for issuers (universities, employers) and credential holders
 */
contract DIDRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct DIDDocument {
        string did;
        address owner;
        string publicKeyPem;
        string serviceEndpoint;
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
    }

    // Mapping from address to DID document
    mapping(address => DIDDocument) private didDocuments;
    
    // Mapping from DID string to address (reverse lookup)
    mapping(string => address) private didToAddress;
    
    // Array of all registered DIDs
    address[] private registeredDIDs;

    event DIDRegistered(address indexed owner, string did, uint256 timestamp);
    event DIDUpdated(address indexed owner, string did, uint256 timestamp);
    event DIDDeactivated(address indexed owner, string did, uint256 timestamp);
    event IssuerRegistered(address indexed issuer, string did, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new DID for the caller
     * @param _did The DID string (e.g., "did:ethr:0x...")
     * @param _publicKeyPem Public key in PEM format
     * @param _serviceEndpoint Service endpoint URL
     */
    function registerDID(
        string memory _did,
        string memory _publicKeyPem,
        string memory _serviceEndpoint
    ) external whenNotPaused {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(!didDocuments[msg.sender].isActive, "DID already registered");
        require(didToAddress[_did] == address(0), "DID already exists");

        DIDDocument memory newDoc = DIDDocument({
            did: _did,
            owner: msg.sender,
            publicKeyPem: _publicKeyPem,
            serviceEndpoint: _serviceEndpoint,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true
        });

        didDocuments[msg.sender] = newDoc;
        didToAddress[_did] = msg.sender;
        registeredDIDs.push(msg.sender);

        emit DIDRegistered(msg.sender, _did, block.timestamp);
    }

    /**
     * @dev Register an issuer (university, employer) with ISSUER_ROLE
     * @param _issuer Address of the issuer
     * @param _did DID for the issuer
     * @param _publicKeyPem Public key
     * @param _serviceEndpoint Service endpoint
     */
    function registerIssuer(
        address _issuer,
        string memory _did,
        string memory _publicKeyPem,
        string memory _serviceEndpoint
    ) external onlyRole(ADMIN_ROLE) {
        require(_issuer != address(0), "Invalid issuer address");
        require(!didDocuments[_issuer].isActive, "Issuer already registered");
        require(didToAddress[_did] == address(0), "DID already exists");

        DIDDocument memory newDoc = DIDDocument({
            did: _did,
            owner: _issuer,
            publicKeyPem: _publicKeyPem,
            serviceEndpoint: _serviceEndpoint,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true
        });

        didDocuments[_issuer] = newDoc;
        didToAddress[_did] = _issuer;
        registeredDIDs.push(_issuer);

        _grantRole(ISSUER_ROLE, _issuer);

        emit IssuerRegistered(_issuer, _did, block.timestamp);
    }

    /**
     * @dev Update DID document
     * @param _publicKeyPem New public key
     * @param _serviceEndpoint New service endpoint
     */
    function updateDID(
        string memory _publicKeyPem,
        string memory _serviceEndpoint
    ) external whenNotPaused {
        require(didDocuments[msg.sender].isActive, "DID not registered");

        DIDDocument storage doc = didDocuments[msg.sender];
        doc.publicKeyPem = _publicKeyPem;
        doc.serviceEndpoint = _serviceEndpoint;
        doc.updatedAt = block.timestamp;

        emit DIDUpdated(msg.sender, doc.did, block.timestamp);
    }

    /**
     * @dev Deactivate a DID
     */
    function deactivateDID() external {
        require(didDocuments[msg.sender].isActive, "DID not active");

        DIDDocument storage doc = didDocuments[msg.sender];
        doc.isActive = false;
        doc.updatedAt = block.timestamp;

        emit DIDDeactivated(msg.sender, doc.did, block.timestamp);
    }

    /**
     * @dev Resolve a DID document by address
     * @param _owner Address of the DID owner
     * @return DID document
     */
    function resolveDID(address _owner) external view returns (DIDDocument memory) {
        require(didDocuments[_owner].isActive, "DID not found or inactive");
        return didDocuments[_owner];
    }

    /**
     * @dev Resolve address by DID string
     * @param _did DID string
     * @return Address of the DID owner
     */
    function resolveAddress(string memory _did) external view returns (address) {
        address owner = didToAddress[_did];
        require(owner != address(0), "DID not found");
        require(didDocuments[owner].isActive, "DID not active");
        return owner;
    }

    /**
     * @dev Check if an address has a registered and active DID
     * @param _owner Address to check
     * @return True if DID is registered and active
     */
    function hasDID(address _owner) external view returns (bool) {
        return didDocuments[_owner].isActive;
    }

    /**
     * @dev Get total number of registered DIDs
     * @return Count of registered DIDs
     */
    function getTotalDIDs() external view returns (uint256) {
        return registeredDIDs.length;
    }

    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}


