import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Mock ZKP Controller for AnonHire
 * Provides working ZKP functionality while we resolve Circom compilation issues
 */

/**
 * Generate a mock ZKP proof
 */
export const generateMockProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credentialId, proofType, threshold, salt } = req.body;

    logger.info(`Generating mock ${proofType} proof for credential ${credentialId}`);

    // Mock proof generation based on type
    let proof;
    
    if (proofType === 'gpa_proof') {
      // Mock GPA proof
      const mockGPA = 375; // 3.75 GPA scaled by 100
      const isValid = mockGPA >= threshold;
      
      proof = {
        type: 'gpa_proof',
        publicInputs: {
          threshold: threshold,
          commitment: generateMockCommitment(mockGPA, salt)
        },
        proof: '0x' + crypto.randomBytes(32).toString('hex'),
        valid: isValid,
        credentialId: credentialId
      };
    } else if (proofType === 'experience_proof') {
      // Mock experience proof
      const mockExperience = 24; // 24 months
      const isValid = mockExperience >= threshold;
      
      proof = {
        type: 'experience_proof',
        publicInputs: {
          requiredMonths: threshold,
          commitment: generateMockCommitment(mockExperience, salt)
        },
        proof: '0x' + crypto.randomBytes(32).toString('hex'),
        valid: isValid,
        credentialId: credentialId
      };
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid proof type'
      });
      return;
    }

    logger.info(`Mock ${proofType} proof generated: ${proof.valid ? 'VALID' : 'INVALID'}`);

    res.json({
      success: true,
      data: proof
    });
  } catch (error: any) {
    logger.error('Error generating mock proof:', error);
    next(error);
  }
};

/**
 * Verify a mock ZKP proof
 */
export const verifyMockProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { proof } = req.body;

    logger.info('Verifying mock proof');

    // Mock verification - always returns true for valid format
    const isValid = proof && proof.length === 66 && proof.startsWith('0x'); // Basic format check

    logger.info(`Mock proof verification result: ${isValid}`);

    res.json({
      success: true,
      data: {
        valid: isValid,
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error verifying mock proof:', error);
    next(error);
  }
};

/**
 * Get ZKP system status
 */
export const getZKPStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Getting ZKP system status');

    const status = {
      status: 'operational',
      version: '1.0.0-mock',
      availableProofs: ['gpa_proof', 'experience_proof'],
      keysGenerated: true,
      mockMode: true,
      message: 'Using mock ZKP system - circuits not yet compiled'
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    logger.error('Error getting ZKP status:', error);
    next(error);
  }
};

/**
 * Generate a mock commitment hash
 */
function generateMockCommitment(value: number, salt: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(value.toString());
  hash.update(salt);
  return '0x' + hash.digest('hex');
}
