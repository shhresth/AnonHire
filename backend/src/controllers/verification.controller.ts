import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../services/blockchain.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const blockchainService = new BlockchainService();

/**
 * Verify a credential
 */
export const verifyCredential = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credentialHash } = req.body;

    logger.info(`Verifying credential: ${credentialHash}`);

    // Get credential from database
    const credential = await prisma.credential.findUnique({
      where: { credentialHash },
      include: {
        issuer: true,
        subject: true,
      },
    });

    if (!credential) {
      res.status(404).json({
        success: false,
        message: 'Credential not found',
      });
      return;
    }

    // Check if revoked in database
    if (credential.isRevoked) {
      res.json({
        success: true,
        data: {
          isValid: false,
          reason: 'Credential is revoked',
          revokedAt: credential.revokedAt,
          revocationReason: credential.revocationReason,
        },
      });
      return;
    }

    // Verify on blockchain
    const isValidOnChain = await blockchainService.verifyCredential(credentialHash);

    // Check revocation on-chain
    const isRevokedOnChain = await blockchainService.isRevoked(credentialHash);

    const isValid = isValidOnChain && !isRevokedOnChain;

    // Log verification
    const verification = await prisma.verification.create({
      data: {
        credentialId: credential.id,
        verifierId: (req as any).user.id,
        isValid,
        proofType: 'CREDENTIAL',
      },
    });

    res.json({
      success: true,
      data: {
        isValid,
        credential: {
          type: credential.credentialType,
          issuer: credential.issuer.address,
          subject: credential.subject.address,
          issuedAt: credential.issuedAt,
          expiresAt: credential.expiresAt,
        },
        verificationId: verification.id,
      },
    });
  } catch (error: any) {
    logger.error('Error verifying credential:', error);
    next(error);
  }
};

/**
 * Get verification details
 */
export const getVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const verification = await prisma.verification.findUnique({
      where: { id },
      include: {
        credential: true,
        verifier: {
          select: {
            address: true,
            role: true,
          },
        },
      },
    });

    if (!verification) {
      res.status(404).json({
        success: false,
        message: 'Verification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: verification,
    });
  } catch (error: any) {
    logger.error('Error getting verification:', error);
    next(error);
  }
};

/**
 * Get all verifications for a credential
 */
export const getCredentialVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credentialId } = req.params;

    const verifications = await prisma.verification.findMany({
      where: { credentialId },
      include: {
        verifier: {
          select: {
            address: true,
            role: true,
          },
        },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    res.json({
      success: true,
      data: verifications,
    });
  } catch (error: any) {
    logger.error('Error getting credential verifications:', error);
    next(error);
  }
};

