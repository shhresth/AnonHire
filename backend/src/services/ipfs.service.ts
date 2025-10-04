import pinataSDK from '@pinata/sdk';
import axios from 'axios';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class IPFSService {
  private pinata: any;
  private gateway: string;

  constructor() {
    this.pinata = new pinataSDK(
      process.env.PINATA_API_KEY!,
      process.env.PINATA_SECRET_KEY!
    );
    this.gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any): Promise<string> {
    try {
      logger.info('Uploading data to IPFS');

      const result = await this.pinata.pinJSONToIPFS(data, {
        pinataMetadata: {
          name: `credential-${Date.now()}`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      });

      const ipfsHash = result.IpfsHash;

      // Save pin info to database
      await prisma.iPFSPin.create({
        data: {
          ipfsHash,
          pinataId: result.PinataId || null,
          fileName: `credential-${Date.now()}.json`,
          fileSize: JSON.stringify(data).length,
          isPinned: true,
        },
      });

      logger.info(`Data uploaded to IPFS: ${ipfsHash}`);
      return ipfsHash;
    } catch (error: any) {
      logger.error('Error uploading to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Get JSON data from IPFS
   */
  async getJSON(ipfsHash: string): Promise<any> {
    try {
      logger.info(`Fetching data from IPFS: ${ipfsHash}`);

      const url = `${this.gateway}${ipfsHash}`;
      const response = await axios.get(url, { timeout: 30000 });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching from IPFS:', error);
      throw new Error(`IPFS fetch failed: ${error.message}`);
    }
  }

  /**
   * Unpin content from IPFS (for GDPR compliance)
   */
  async unpin(ipfsHash: string): Promise<void> {
    try {
      logger.info(`Unpinning content from IPFS: ${ipfsHash}`);

      await this.pinata.unpin(ipfsHash);

      // Update database
      await prisma.iPFSPin.update({
        where: { ipfsHash },
        data: {
          isPinned: false,
          unpinnedAt: new Date(),
        },
      });

      logger.info(`Content unpinned: ${ipfsHash}`);
    } catch (error: any) {
      logger.error('Error unpinning from IPFS:', error);
      throw new Error(`IPFS unpin failed: ${error.message}`);
    }
  }

  /**
   * Check pin status
   */
  async isPinned(ipfsHash: string): Promise<boolean> {
    try {
      const pinList = await this.pinata.pinList({
        hashContains: ipfsHash,
      });

      return pinList.count > 0;
    } catch (error: any) {
      logger.error('Error checking pin status:', error);
      return false;
    }
  }

  /**
   * Get all pins
   */
  async getAllPins(): Promise<any[]> {
    try {
      const pinList = await this.pinata.pinList({
        status: 'pinned',
      });

      return pinList.rows;
    } catch (error: any) {
      logger.error('Error getting pins:', error);
      return [];
    }
  }
}


