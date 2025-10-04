import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ZKPService } from '../services/zkp.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const zkpService = new ZKPService();

/**
 * Generate GPA proof
 */
export const generateGPAProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gpa, threshold, credentialHash } = req.body;

    logger.info(`Generating GPA proof: gpa=${gpa}, threshold=${threshold}`);

    // Generate salt
    const salt = zkpService.generateSalt();

    // Convert credential hash to BigInt
    const credHashBigInt = BigInt(credentialHash);

    // Generate proof
    const { proof, publicSignals } = await zkpService.generateGPAProof({
      gpa: parseFloat(gpa),
      threshold: parseFloat(threshold),
      salt,
      credentialHash: credHashBigInt,
    });

    res.json({
      success: true,
      data: {
        proof,
        publicSignals,
        salt: salt.toString(),
      },
    });
  } catch (error: any) {
    logger.error('Error generating GPA proof:', error);
    next(error);
  }
};

/**
 * Verify GPA proof
 */
export const verifyGPAProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { proof, publicSignals } = req.body;

    logger.info('Verifying GPA proof');

    const isValid = await zkpService.verifyGPAProof(proof, publicSignals);

    // Log verification
    await prisma.verification.create({
      data: {
        credentialId: req.body.credentialId || '',
        verifierId: (req as any).user.id,
        isValid,
        proofType: 'GPA',
        proofData: JSON.stringify({ proof, publicSignals }),
      },
    });

    res.json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Proof verified successfully' : 'Proof verification failed',
      },
    });
  } catch (error: any) {
    logger.error('Error verifying GPA proof:', error);
    next(error);
  }
};

/**
 * Generate experience proof
 */
export const generateExperienceProof = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { experienceMonths, requiredMonths, credentialHash } = req.body;

    logger.info(
      `Generating experience proof: experience=${experienceMonths}, required=${requiredMonths}`
    );

    // Generate salt
    const salt = zkpService.generateSalt();

    // Convert credential hash to BigInt
    const credHashBigInt = BigInt(credentialHash);

    // Generate proof
    const { proof, publicSignals } = await zkpService.generateExperienceProof({
      experienceMonths: parseInt(experienceMonths),
      requiredMonths: parseInt(requiredMonths),
      salt,
      credentialHash: credHashBigInt,
    });

    res.json({
      success: true,
      data: {
        proof,
        publicSignals,
        salt: salt.toString(),
      },
    });
  } catch (error: any) {
    logger.error('Error generating experience proof:', error);
    next(error);
  }
};

/**
 * Verify experience proof
 */
export const verifyExperienceProof = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { proof, publicSignals } = req.body;

    logger.info('Verifying experience proof');

    const isValid = await zkpService.verifyExperienceProof(proof, publicSignals);

    // Log verification
    await prisma.verification.create({
      data: {
        credentialId: req.body.credentialId || '',
        verifierId: (req as any).user.id,
        isValid,
        proofType: 'EXPERIENCE',
        proofData: JSON.stringify({ proof, publicSignals }),
      },
    });

    res.json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Proof verified successfully' : 'Proof verification failed',
      },
    });
  } catch (error: any) {
    logger.error('Error verifying experience proof:', error);
    next(error);
  }
};

