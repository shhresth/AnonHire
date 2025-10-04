import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../services/blockchain.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const blockchainService = new BlockchainService();

/**
 * Register a DID
 */
export const registerDID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { did, publicKeyPem, serviceEndpoint } = req.body;
    const userId = (req as any).user.id;
    const userAddress = (req as any).user.address;

    logger.info(`Registering DID for user: ${userAddress}`);

    // Check if user already has a DID
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser?.did) {
      res.status(409).json({
        success: false,
        message: 'User already has a registered DID',
      });
      return;
    }

    // Register DID on blockchain
    const txHash = await blockchainService.registerDID(
      did,
      publicKeyPem,
      serviceEndpoint || ''
    );

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: { did },
    });

    logger.info(`DID registered successfully: ${did}`);

    res.status(201).json({
      success: true,
      data: {
        did,
        txHash,
      },
    });
  } catch (error: any) {
    logger.error('Error registering DID:', error);
    next(error);
  }
};

/**
 * Resolve DID by address
 */
export const resolveDID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address } = req.params;

    logger.info(`Resolving DID for address: ${address}`);

    // Get DID document from blockchain
    const didDocument = await blockchainService.resolveDID(address);

    if (!didDocument) {
      res.status(404).json({
        success: false,
        message: 'DID not found',
      });
      return;
    }

    res.json({
      success: true,
      data: didDocument,
    });
  } catch (error: any) {
    logger.error('Error resolving DID:', error);
    next(error);
  }
};

