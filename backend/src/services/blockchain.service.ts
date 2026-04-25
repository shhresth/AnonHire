import { ethers } from 'ethers';
import { logger } from '../utils/logger';

// Import contract ABIs (will be generated after compiling contracts)
// For now, we'll use placeholders
let VerifiableCredentialABI: any;
let DIDRegistryABI: any;
let RevocationRegistryABI: any;

try {
  VerifiableCredentialABI = require('../../../contracts/artifacts/src/VerifiableCredential.sol/VerifiableCredential.json');
  DIDRegistryABI = require('../../../contracts/artifacts/src/DIDRegistry.sol/DIDRegistry.json');
  RevocationRegistryABI = require('../../../contracts/artifacts/src/RevocationRegistry.sol/RevocationRegistry.json');
} catch (error) {
  logger.warn('Contract artifacts not found. Please compile contracts first.');
  // Placeholder ABIs
  VerifiableCredentialABI = { abi: [] };
  DIDRegistryABI = { abi: [] };
  RevocationRegistryABI = { abi: [] };
}

export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Wallet | null = null;
  private vcContract: ethers.Contract | null = null;
  private didContract: ethers.Contract | null = null;
  private revocationContract: ethers.Contract | null = null;

  constructor() {
    // Initialize provider (optional - will warn if not configured)
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.POLYGON_MUMBAI_RPC_URL;
    if (!rpcUrl) {
      logger.warn('Blockchain RPC URL not configured. Blockchain features will be disabled.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize signer (optional)
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      logger.warn('Private key not configured. Write operations will be disabled.');
      return;
    }

    this.signer = new ethers.Wallet(privateKey, this.provider);

    // Initialize contracts (optional)
    const vcAddress = process.env.CONTRACT_VERIFIABLE_CREDENTIAL;
    const didAddress = process.env.CONTRACT_DID_REGISTRY;
    const revocationAddress = process.env.CONTRACT_REVOCATION_REGISTRY;

    if (!vcAddress || !didAddress || !revocationAddress) {
      logger.warn('Contract addresses not configured. Smart contract features will be disabled.');
      return;
    }

    this.vcContract = new ethers.Contract(
      vcAddress,
      VerifiableCredentialABI.abi,
      this.signer
    );

    this.didContract = new ethers.Contract(
      didAddress,
      DIDRegistryABI.abi,
      this.signer
    );

    this.revocationContract = new ethers.Contract(
      revocationAddress,
      RevocationRegistryABI.abi,
      this.signer
    );
  }

  /**
   * Check if blockchain is configured
   */
  private isConfigured(): boolean {
    return this.vcContract !== null && this.signer !== null;
  }

  /**
   * Issue academic credential on-chain
   */
  async issueAcademicVC(
    subject: string,
    ipfsHash: string,
    expiresAt: number
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Blockchain service not configured');
    }
    
    try {
      logger.info(`Issuing academic credential on-chain for ${subject}`);

      // Contract requires both issuer and subject to have registered DIDs
      const issuerAddress = await this.signer!.getAddress();
      await this.ensureDID(issuerAddress);
      await this.ensureDID(subject);

      const tx = await this.vcContract!.issueAcademicVC(subject, ipfsHash, expiresAt, {
        gasLimit: 500000,
      });

      const receipt = await tx.wait();
      logger.info(`Transaction confirmed: ${receipt.hash}`);

      return receipt.hash;
    } catch (error: any) {
      logger.error('Error issuing academic credential:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Issue job credential on-chain
   */
  async issueJobVC(subject: string, ipfsHash: string, expiresAt: number): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Blockchain service not configured');
    }
    
    try {
      logger.info(`Issuing job credential on-chain for ${subject}`);

      // Contract requires both issuer and subject to have registered DIDs
      const issuerAddress = await this.signer!.getAddress();
      await this.ensureDID(issuerAddress);
      await this.ensureDID(subject);

      const tx = await this.vcContract!.issueJobVC(subject, ipfsHash, expiresAt, {
        gasLimit: 500000,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      logger.error('Error issuing job credential:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Issue internship credential on-chain
   */
  async issueInternshipVC(
    subject: string,
    ipfsHash: string,
    expiresAt: number
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Blockchain service not configured');
    }
    
    try {
      logger.info(`Issuing internship credential on-chain for ${subject}`);

      // Contract requires both issuer and subject to have registered DIDs
      const issuerAddress = await this.signer!.getAddress();
      await this.ensureDID(issuerAddress);
      await this.ensureDID(subject);

      const tx = await this.vcContract!.issueInternshipVC(subject, ipfsHash, expiresAt, {
        gasLimit: 500000,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      logger.error('Error issuing internship credential:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Revoke a credential on-chain
   */
  async revokeVC(credentialHash: string, reason: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Blockchain service not configured');
    }
    
    try {
      logger.info(`Revoking credential on-chain: ${credentialHash}`);

      const tx = await this.vcContract!.revokeVC(credentialHash, reason, {
        gasLimit: 300000,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      logger.error('Error revoking credential:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Verify a credential on-chain
   */
  async verifyCredential(credentialHash: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('Blockchain service not configured, returning false');
      return false;
    }
    
    try {
      logger.info(`Verifying credential on-chain: ${credentialHash}`);

      const tx = await this.vcContract!.verifyCredential(credentialHash);
      const receipt = await tx.wait();

      // Parse events to get verification result
      const event = receipt.logs.find((log: any) => {
        try {
          return this.vcContract!.interface.parseLog(log)?.name === 'CredentialVerified';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = this.vcContract!.interface.parseLog(event);
        return parsedEvent?.args.isValid;
      }

      return false;
    } catch (error: any) {
      logger.error('Error verifying credential:', error);
      return false;
    }
  }

  /**
   * Register a DID
   */
  async registerDID(
    did: string,
    publicKeyPem: string,
    serviceEndpoint: string
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Blockchain service not configured');
    }
    
    try {
      logger.info(`Registering DID: ${did}`);

      const tx = await this.didContract!.registerDID(did, publicKeyPem, serviceEndpoint, {
        gasLimit: 300000,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      logger.error('Error registering DID:', error);
      throw new Error(`DID registration failed: ${error.message}`);
    }
  }

  /**
   * Ensure an address has a registered DID, registering one on-chain if not.
   * Uses the backend signer to register DIDs for subject addresses.
   */
  private async ensureDID(address: string): Promise<void> {
    try {
      const hasDID: boolean = await this.didContract!.hasDID(address);
      if (hasDID) return;

      logger.info(`Auto-registering DID for address: ${address}`);
      const did = `did:ethr:${address.toLowerCase()}`;
      const tx = await this.didContract!.registerDID(
        did,
        '-----BEGIN PUBLIC KEY-----\nANONHIRE-AUTO-KEY\n-----END PUBLIC KEY-----',
        'https://anonhire.vercel.app/did-service',
        { gasLimit: 300000 }
      );
      await tx.wait();
      logger.info(`DID auto-registered for ${address}`);
    } catch (error: any) {
      // If already registered (race condition), that's fine
      if (error?.message?.includes('already registered') || error?.message?.includes('already exists')) {
        logger.info(`DID already exists for ${address} (race condition ok)`);
        return;
      }
      throw error;
    }
  }

  /**
   * Resolve a DID
   */
  async resolveDID(address: string): Promise<any> {
    if (!this.isConfigured()) {
      logger.warn('Blockchain service not configured');
      return null;
    }
    
    try {
      logger.info(`Resolving DID for address: ${address}`);

      const didDocument = await this.didContract!.resolveDID(address);
      return didDocument;
    } catch (error: any) {
      logger.error('Error resolving DID:', error);
      return null;
    }
  }

  /**
   * Check if credential is revoked
   */
  async isRevoked(credentialHash: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('Blockchain service not configured, returning false');
      return false;
    }
    
    try {
      return await this.revocationContract!.isRevoked(credentialHash);
    } catch (error: any) {
      logger.error('Error checking revocation:', error);
      return false;
    }
  }

  /**
   * Get credential from blockchain
   */
  async getCredential(credentialHash: string): Promise<any> {
    if (!this.isConfigured()) {
      logger.warn('Blockchain service not configured');
      return null;
    }
    
    try {
      const credential = await this.vcContract!.getCredential(credentialHash);
      return credential;
    } catch (error: any) {
      logger.error('Error getting credential:', error);
      return null;
    }
  }

  /**
   * Get blockchain statistics
   */
  async getStatistics(): Promise<any> {
    if (!this.isConfigured()) {
      logger.warn('Blockchain service not configured');
      return null;
    }
    
    try {
      const stats = await this.vcContract!.getStatistics();
      return {
        total: stats.total.toString(),
        academic: stats.academic.toString(),
        job: stats.job.toString(),
        internship: stats.internship.toString(),
      };
    } catch (error: any) {
      logger.error('Error getting statistics:', error);
      return null;
    }
  }
}

