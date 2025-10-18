import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../services/blockchain.service';
import { IPFSService } from '../services/ipfs.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const blockchainService = new BlockchainService();
const ipfsService = new IPFSService();

/**
 * Validate credential parameters against verification requirements
 */
async function validateCredentialParameters(credential: any, verificationParams: any) {
  try {
    // Get decrypted credential data from IPFS
    const ipfsData = await ipfsService.getData(credential.ipfsHash);
    if (!ipfsData) {
      return {
        isValid: false,
        reason: 'Could not retrieve credential data from IPFS'
      };
    }

    const credentialData = ipfsData.credentialSubject || ipfsData;
    const validationResults = [];

    // Check GPA requirements
    if (verificationParams.minGpa !== undefined) {
      const studentGpa = parseFloat(credentialData.gpa);
      const minGpa = parseFloat(verificationParams.minGpa);
      
      validationResults.push({
        parameter: 'gpa',
        required: `>= ${minGpa}`,
        actual: studentGpa,
        isValid: studentGpa >= minGpa,
        message: studentGpa >= minGpa 
          ? `GPA ${studentGpa} meets requirement (>= ${minGpa})`
          : `GPA ${studentGpa} does not meet requirement (>= ${minGpa})`
      });
    }

    // Check degree requirements
    if (verificationParams.requiredDegree) {
      const studentDegree = credentialData.degree;
      const requiredDegree = verificationParams.requiredDegree;
      
      validationResults.push({
        parameter: 'degree',
        required: requiredDegree,
        actual: studentDegree,
        isValid: studentDegree === requiredDegree,
        message: studentDegree === requiredDegree
          ? `Degree ${studentDegree} matches requirement`
          : `Degree ${studentDegree} does not match requirement (${requiredDegree})`
      });
    }

    // Check major requirements
    if (verificationParams.requiredMajor) {
      const studentMajor = credentialData.major;
      const requiredMajor = verificationParams.requiredMajor;
      
      validationResults.push({
        parameter: 'major',
        required: requiredMajor,
        actual: studentMajor,
        isValid: studentMajor === requiredMajor,
        message: studentMajor === requiredMajor
          ? `Major ${studentMajor} matches requirement`
          : `Major ${studentMajor} does not match requirement (${requiredMajor})`
      });
    }

    // Check graduation year requirements
    if (verificationParams.minGraduationYear) {
      const studentYear = parseInt(credentialData.graduationYear);
      const minYear = parseInt(verificationParams.minGraduationYear);
      
      validationResults.push({
        parameter: 'graduationYear',
        required: `>= ${minYear}`,
        actual: studentYear,
        isValid: studentYear >= minYear,
        message: studentYear >= minYear
          ? `Graduation year ${studentYear} meets requirement (>= ${minYear})`
          : `Graduation year ${studentYear} does not meet requirement (>= ${minYear})`
      });
    }

    // Check experience requirements (for job credentials)
    if (verificationParams.minExperience && credential.credentialType === 'JOB') {
      const studentExperience = parseInt(credentialData.experienceMonths);
      const minExperience = parseInt(verificationParams.minExperience);
      
      validationResults.push({
        parameter: 'experience',
        required: `>= ${minExperience} months`,
        actual: `${studentExperience} months`,
        isValid: studentExperience >= minExperience,
        message: studentExperience >= minExperience
          ? `Experience ${studentExperience} months meets requirement (>= ${minExperience})`
          : `Experience ${studentExperience} months does not meet requirement (>= ${minExperience})`
      });
    }

    // Check skills requirements
    if (verificationParams.requiredSkills && Array.isArray(verificationParams.requiredSkills)) {
      const studentSkills = credentialData.skills || [];
      const requiredSkills = verificationParams.requiredSkills;
      const hasAllSkills = requiredSkills.every((skill: string) => 
        studentSkills.some((studentSkill: string) => 
          studentSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      validationResults.push({
        parameter: 'skills',
        required: requiredSkills,
        actual: studentSkills,
        isValid: hasAllSkills,
        message: hasAllSkills
          ? `All required skills are present`
          : `Missing required skills: ${requiredSkills.filter((skill: string) => 
              !studentSkills.some((studentSkill: string) => 
                studentSkill.toLowerCase().includes(skill.toLowerCase())
              )
            ).join(', ')}`
      });
    }

    // Overall validation result
    const allValid = validationResults.every(result => result.isValid);

    return {
      isValid: allValid,
      results: validationResults,
      summary: allValid 
        ? 'All verification parameters met'
        : `${validationResults.filter(r => !r.isValid).length} parameter(s) not met`
    };

  } catch (error: any) {
    logger.error('Error validating credential parameters:', error);
    return {
      isValid: false,
      reason: 'Error validating parameters',
      error: error.message
    };
  }
}

/**
 * Verify a credential with optional parameters
 */
export const verifyCredential = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credentialHash, verificationParams } = req.body;

    logger.info(`Verifying credential: ${credentialHash}`, { verificationParams });

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

    // Check verification parameters if provided
    let parameterValidation = null;
    if (verificationParams && isValid) {
      parameterValidation = await validateCredentialParameters(credential, verificationParams);
    }

    // Log verification
    const verification = await prisma.verification.create({
      data: {
        credentialId: credential.id,
        verifierId: (req as any).user?.id || null,
        isValid,
        proofType: 'CREDENTIAL',
        verificationParams: verificationParams ? JSON.stringify(verificationParams) : null,
      },
    });

    res.json({
      success: true,
      data: {
        isValid,
        parameterValidation,
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
 * Public verification with parameters (no auth required)
 */
export const verifyCredentialWithParams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credentialHash, verificationParams } = req.body;

    logger.info(`Public verify credential with params: ${credentialHash}`, { verificationParams });

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
    const isRevokedOnChain = await blockchainService.isRevoked(credentialHash);
    const isValid = isValidOnChain && !isRevokedOnChain;

    // Check verification parameters
    let parameterValidation = null;
    if (verificationParams && isValid) {
      parameterValidation = await validateCredentialParameters(credential, verificationParams);
    }

    res.json({
      success: true,
      data: {
        isValid,
        parameterValidation,
        credential: {
          type: credential.credentialType,
          issuer: credential.issuer.address,
          subject: credential.subject.address,
          issuedAt: credential.issuedAt,
          expiresAt: credential.expiresAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error verifying credential with params:', error);
    next(error);
  }
};
/**
 * Public GET verify by hash (no auth) for quick testing
 */
export const verifyByHash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credentialHash } = req.params;

    logger.info(`Public verify credential: ${credentialHash}`);

    // DB record is ground-truth for issuance in this app
    const credential = await prisma.credential.findUnique({ where: { credentialHash } });
    const isRevokedDb = credential?.isRevoked ?? false;
    // Best-effort chain revocation check
    const isRevokedOnChain = await blockchainService.isRevoked(credentialHash);
    // Consider valid if present in DB and not revoked (either source)
    const isValid = !!(credential && !isRevokedDb && !isRevokedOnChain);

    // Try to enrich with public summary from IPFS (non-sensitive)
    let publicSummary: any = null;
    if (credential?.ipfsHash) {
      try {
        const ipfsJson = await ipfsService.getJSON(credential.ipfsHash);
        if (ipfsJson && typeof ipfsJson === 'object') {
          publicSummary = ipfsJson.publicSummary || null;
        }
      } catch (e) {
        // best-effort only
      }
    }

    // Build a readable statement for verifiers
    const statement = credential ? `This verifies a ${credential.credentialType} credential issued by ${credential.issuerId ? 'the issuer' : 'an issuer'} on ${credential.issuedAt?.toISOString?.() ?? credential.issuedAt}` : null;

    res.json({
      success: true,
      data: {
        isValid,
        isRevokedDb,
        isRevokedOnChain,
        credential: credential ? {
          credentialHash,
          ipfsHash: credential.ipfsHash,
          txHash: credential.txHash,
          type: credential.credentialType,
          issuedAt: credential.issuedAt,
          expiresAt: credential.expiresAt,
          publicSummary,
          statement,
        } : null,
      }
    });
  } catch (error: any) {
    logger.error('Error public verify:', error);
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

