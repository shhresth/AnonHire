// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RevocationRegistry
 * @dev On-chain registry for credential revocation status
 * @notice Gas-optimized storage for revocation status checks
 */
contract RevocationRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct RevocationRecord {
        bool isRevoked;
        uint256 revokedAt;
        address revokedBy;
        string reason;
    }

    // Mapping from credential hash to revocation status
    mapping(bytes32 => RevocationRecord) private revocations;
    
    // Mapping from issuer to their revoked credentials
    mapping(address => bytes32[]) private issuerRevocations;

    // Total revocation count
    uint256 private totalRevocations;

    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed issuer,
        string reason,
        uint256 timestamp
    );
    
    event RevocationRestored(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Revoke a credential
     * @param _credentialHash Hash of the credential to revoke
     * @param _reason Reason for revocation
     */
    function revokeCredential(
        bytes32 _credentialHash,
        string memory _reason
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(_credentialHash != bytes32(0), "Invalid credential hash");
        require(!revocations[_credentialHash].isRevoked, "Already revoked");

        revocations[_credentialHash] = RevocationRecord({
            isRevoked: true,
            revokedAt: block.timestamp,
            revokedBy: msg.sender,
            reason: _reason
        });

        issuerRevocations[msg.sender].push(_credentialHash);
        totalRevocations++;

        emit CredentialRevoked(_credentialHash, msg.sender, _reason, block.timestamp);
    }

    /**
     * @dev Restore a revoked credential (emergency only)
     * @param _credentialHash Hash of the credential to restore
     */
    function restoreCredential(
        bytes32 _credentialHash
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(revocations[_credentialHash].isRevoked, "Not revoked");

        address issuer = revocations[_credentialHash].revokedBy;
        delete revocations[_credentialHash];
        totalRevocations--;

        emit RevocationRestored(_credentialHash, issuer, block.timestamp);
    }

    /**
     * @dev Check if a credential is revoked
     * @param _credentialHash Hash of the credential
     * @return True if revoked, false otherwise
     */
    function isRevoked(bytes32 _credentialHash) external view returns (bool) {
        return revocations[_credentialHash].isRevoked;
    }

    /**
     * @dev Get revocation details
     * @param _credentialHash Hash of the credential
     * @return Revocation record
     */
    function getRevocationRecord(
        bytes32 _credentialHash
    ) external view returns (RevocationRecord memory) {
        require(revocations[_credentialHash].isRevoked, "Not revoked");
        return revocations[_credentialHash];
    }

    /**
     * @dev Get all revoked credentials by an issuer
     * @param _issuer Address of the issuer
     * @return Array of revoked credential hashes
     */
    function getIssuerRevocations(
        address _issuer
    ) external view returns (bytes32[] memory) {
        return issuerRevocations[_issuer];
    }

    /**
     * @dev Get total number of revocations
     * @return Count of revoked credentials
     */
    function getTotalRevocations() external view returns (uint256) {
        return totalRevocations;
    }

    /**
     * @dev Batch check revocation status
     * @param _credentialHashes Array of credential hashes
     * @return Array of revocation statuses
     */
    function batchCheckRevocation(
        bytes32[] memory _credentialHashes
    ) external view returns (bool[] memory) {
        bool[] memory statuses = new bool[](_credentialHashes.length);
        
        for (uint256 i = 0; i < _credentialHashes.length; i++) {
            statuses[i] = revocations[_credentialHashes[i]].isRevoked;
        }
        
        return statuses;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}


