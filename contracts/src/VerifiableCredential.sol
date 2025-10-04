// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./DIDRegistry.sol";
import "./RevocationRegistry.sol";

/**
 * @title VerifiableCredential
 * @dev Main contract for issuing and verifying credentials
 * @notice Gas-optimized credential storage with IPFS hash references
 */
contract VerifiableCredential is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum CredentialType { ACADEMIC, JOB, INTERNSHIP }

    struct Credential {
        bytes32 credentialHash;
        CredentialType credentialType;
        address issuer;
        address subject;
        string ipfsHash;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isValid;
    }

    // Registry references
    DIDRegistry public didRegistry;
    RevocationRegistry public revocationRegistry;

    // Mapping from credential hash to credential data
    mapping(bytes32 => Credential) private credentials;
    
    // Mapping from subject to their credential hashes
    mapping(address => bytes32[]) private subjectCredentials;
    
    // Mapping from issuer to their issued credential hashes
    mapping(address => bytes32[]) private issuerCredentials;

    // Statistics
    uint256 private totalCredentialsIssued;
    mapping(CredentialType => uint256) private credentialTypeCount;

    event CredentialIssued(
        bytes32 indexed credentialHash,
        CredentialType indexed credentialType,
        address indexed issuer,
        address subject,
        string ipfsHash,
        uint256 timestamp
    );

    event CredentialVerified(
        bytes32 indexed credentialHash,
        address indexed verifier,
        bool isValid,
        uint256 timestamp
    );

    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 timestamp
    );

    constructor(address _didRegistry, address _revocationRegistry) {
        require(_didRegistry != address(0), "Invalid DID registry");
        require(_revocationRegistry != address(0), "Invalid revocation registry");

        didRegistry = DIDRegistry(_didRegistry);
        revocationRegistry = RevocationRegistry(_revocationRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Issue an academic credential
     * @param _subject Address of the credential holder
     * @param _ipfsHash IPFS hash containing encrypted credential data
     * @param _expiresAt Expiration timestamp (0 for no expiration)
     * @return credentialHash Hash of the issued credential
     */
    function issueAcademicVC(
        address _subject,
        string memory _ipfsHash,
        uint256 _expiresAt
    ) external onlyRole(ISSUER_ROLE) whenNotPaused returns (bytes32) {
        return _issueCredential(_subject, _ipfsHash, _expiresAt, CredentialType.ACADEMIC);
    }

    /**
     * @dev Issue a job credential
     * @param _subject Address of the credential holder
     * @param _ipfsHash IPFS hash containing encrypted credential data
     * @param _expiresAt Expiration timestamp (0 for no expiration)
     * @return credentialHash Hash of the issued credential
     */
    function issueJobVC(
        address _subject,
        string memory _ipfsHash,
        uint256 _expiresAt
    ) external onlyRole(ISSUER_ROLE) whenNotPaused returns (bytes32) {
        return _issueCredential(_subject, _ipfsHash, _expiresAt, CredentialType.JOB);
    }

    /**
     * @dev Issue an internship credential
     * @param _subject Address of the credential holder
     * @param _ipfsHash IPFS hash containing encrypted credential data
     * @param _expiresAt Expiration timestamp (0 for no expiration)
     * @return credentialHash Hash of the issued credential
     */
    function issueInternshipVC(
        address _subject,
        string memory _ipfsHash,
        uint256 _expiresAt
    ) external onlyRole(ISSUER_ROLE) whenNotPaused returns (bytes32) {
        return _issueCredential(_subject, _ipfsHash, _expiresAt, CredentialType.INTERNSHIP);
    }

    /**
     * @dev Internal function to issue credentials
     */
    function _issueCredential(
        address _subject,
        string memory _ipfsHash,
        uint256 _expiresAt,
        CredentialType _type
    ) internal returns (bytes32) {
        require(_subject != address(0), "Invalid subject");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        require(didRegistry.hasDID(msg.sender), "Issuer must have DID");
        require(didRegistry.hasDID(_subject), "Subject must have DID");

        // Generate credential hash
        bytes32 credentialHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _subject,
                _ipfsHash,
                block.timestamp,
                _type
            )
        );

        require(!credentials[credentialHash].isValid, "Credential already exists");

        // Store credential
        Credential memory newCredential = Credential({
            credentialHash: credentialHash,
            credentialType: _type,
            issuer: msg.sender,
            subject: _subject,
            ipfsHash: _ipfsHash,
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            isValid: true
        });

        credentials[credentialHash] = newCredential;
        subjectCredentials[_subject].push(credentialHash);
        issuerCredentials[msg.sender].push(credentialHash);

        totalCredentialsIssued++;
        credentialTypeCount[_type]++;

        emit CredentialIssued(
            credentialHash,
            _type,
            msg.sender,
            _subject,
            _ipfsHash,
            block.timestamp
        );

        return credentialHash;
    }

    /**
     * @dev Revoke a credential
     * @param _credentialHash Hash of the credential to revoke
     * @param _reason Reason for revocation
     */
    function revokeVC(
        bytes32 _credentialHash,
        string memory _reason
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        Credential storage credential = credentials[_credentialHash];
        require(credential.isValid, "Credential not found");
        require(credential.issuer == msg.sender, "Not the issuer");

        credential.isValid = false;

        // Register revocation in revocation registry
        revocationRegistry.revokeCredential(_credentialHash, _reason);

        emit CredentialRevoked(_credentialHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify a credential
     * @param _credentialHash Hash of the credential to verify
     * @return isValid True if credential is valid
     */
    function verifyCredential(
        bytes32 _credentialHash
    ) external returns (bool isValid) {
        Credential memory credential = credentials[_credentialHash];
        
        // Check if credential exists
        if (!credential.isValid) {
            emit CredentialVerified(_credentialHash, msg.sender, false, block.timestamp);
            return false;
        }

        // Check expiration
        if (credential.expiresAt > 0 && block.timestamp > credential.expiresAt) {
            emit CredentialVerified(_credentialHash, msg.sender, false, block.timestamp);
            return false;
        }

        // Check revocation status
        if (revocationRegistry.isRevoked(_credentialHash)) {
            emit CredentialVerified(_credentialHash, msg.sender, false, block.timestamp);
            return false;
        }

        emit CredentialVerified(_credentialHash, msg.sender, true, block.timestamp);
        return true;
    }

    /**
     * @dev Get credential details
     * @param _credentialHash Hash of the credential
     * @return Credential data
     */
    function getCredential(
        bytes32 _credentialHash
    ) external view returns (Credential memory) {
        require(credentials[_credentialHash].isValid, "Credential not found");
        return credentials[_credentialHash];
    }

    /**
     * @dev Get all credentials for a subject
     * @param _subject Address of the subject
     * @return Array of credential hashes
     */
    function getSubjectCredentials(
        address _subject
    ) external view returns (bytes32[] memory) {
        return subjectCredentials[_subject];
    }

    /**
     * @dev Get all credentials issued by an issuer
     * @param _issuer Address of the issuer
     * @return Array of credential hashes
     */
    function getIssuerCredentials(
        address _issuer
    ) external view returns (bytes32[] memory) {
        return issuerCredentials[_issuer];
    }

    /**
     * @dev Get statistics
     * @return total Total credentials issued
     * @return academic Academic credentials count
     * @return job Job credentials count
     * @return internship Internship credentials count
     */
    function getStatistics() external view returns (
        uint256 total,
        uint256 academic,
        uint256 job,
        uint256 internship
    ) {
        return (
            totalCredentialsIssued,
            credentialTypeCount[CredentialType.ACADEMIC],
            credentialTypeCount[CredentialType.JOB],
            credentialTypeCount[CredentialType.INTERNSHIP]
        );
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


