import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ZKPService } from '../services/zkp.service';
import { EncryptionService } from '../services/encryption.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const zkpService = new ZKPService();
const encryptionService = new EncryptionService();

/**
 * Generate GPA proof (raw values supplied by caller)
 */
export const generateGPAProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gpa, threshold, credentialHash } = req.body;

    logger.info(`Generating GPA proof: gpa=${gpa}, threshold=${threshold}`);

    const salt = zkpService.generateSalt();
    const credHashBigInt = BigInt(credentialHash);

    const { proof, publicSignals } = await zkpService.generateGPAProof({
      gpa: parseFloat(gpa),
      threshold: parseFloat(threshold),
      salt,
      credentialHash: credHashBigInt,
    });

    res.json({
      success: true,
      data: { proof, publicSignals, salt: salt.toString() },
    });
  } catch (error: any) {
    logger.error('Error generating GPA proof:', error);
    next(error);
  }
};

/**
 * Generate GPA proof from an owned credential.
 * The server decrypts the credential, extracts the GPA, generates the proof,
 * and returns the proof — the raw GPA value is NEVER sent back to the client.
 */
export const generateGPAProofFromCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credentialId, threshold } = req.body;
    const userId = (req as any).user.id;

    logger.info(`Generating GPA proof from credential ${credentialId} for user ${userId}`);

    // Look up the credential
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      select: { id: true, credentialType: true, subjectId: true, encryptedData: true, credentialHash: true },
    });

    if (!credential) {
      res.status(404).json({ success: false, message: 'Credential not found' });
      return;
    }

    // Only the credential owner may generate proofs
    if (credential.subjectId !== userId) {
      res.status(403).json({ success: false, message: 'You can only generate proofs for your own credentials' });
      return;
    }

    if (credential.credentialType !== 'ACADEMIC') {
      res.status(400).json({ success: false, message: 'GPA proofs require an ACADEMIC credential' });
      return;
    }

    if (!credential.encryptedData) {
      res.status(400).json({ success: false, message: 'Credential has no encrypted data' });
      return;
    }

    // Decrypt and extract GPA — raw value stays server-side only
    const plaintext = encryptionService.decrypt(credential.encryptedData);
    const credentialData = JSON.parse(plaintext);
    const gpa: number = credentialData?.credentialSubject?.gpa;

    if (gpa === undefined || gpa === null || isNaN(gpa)) {
      res.status(400).json({ success: false, message: 'Credential does not contain a valid GPA' });
      return;
    }

    const salt = zkpService.generateSalt();
    const credHashBigInt = BigInt(credential.credentialHash);
    const thresholdFloat = parseFloat(threshold);

    const { proof, publicSignals } = await zkpService.generateGPAProof({
      gpa,
      threshold: thresholdFloat,
      salt,
      credentialHash: credHashBigInt,
    });

    logger.info(`GPA proof generated for credential ${credentialId} — GPA not disclosed`);

    // Return proof package; GPA is intentionally omitted
    res.json({
      success: true,
      data: {
        proofType: 'gpa',
        proof,
        publicSignals,
        threshold: thresholdFloat,
        credentialHash: credential.credentialHash,
      },
    });
  } catch (error: any) {
    logger.error('Error generating GPA proof from credential:', error);
    next(error);
  }
};

/**
 * Verify GPA proof (public — no authentication required)
 */
export const verifyGPAProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { proof, publicSignals } = req.body;

    logger.info('Verifying GPA proof');

    const isValid = await zkpService.verifyGPAProof(proof, publicSignals);

    // Decode public signals for human-readable response.
    // Common layouts seen in this codebase/circuits:
    // 1) [valid, scaledThreshold, commitment]
    // 2) [scaledThreshold, commitment, valid] (legacy parsing assumption)
    const isBinarySignal = (v: any) => v === '0' || v === '1' || v === 0 || v === 1;

    let scaledThreshold: number | null = null;
    let circuitValid = false;

    if (isBinarySignal(publicSignals?.[0])) {
      circuitValid = publicSignals?.[0] === '1' || publicSignals?.[0] === 1;
      scaledThreshold = publicSignals?.[1] != null ? Number(publicSignals[1]) : null;
    } else {
      // Legacy fallback
      scaledThreshold = publicSignals?.[0] != null ? Number(publicSignals[0]) : null;
      circuitValid = publicSignals?.[2] === '1' || publicSignals?.[2] === 1;
    }

    const thresholdGPA =
      scaledThreshold !== null && Number.isFinite(scaledThreshold)
        ? (scaledThreshold / 100).toFixed(2)
        : null;

    // Log verification if an authenticated user is available (optional)
    const user = (req as any).user;
    if (user && req.body.credentialId) {
      try {
        await prisma.verification.create({
          data: {
            credentialId: req.body.credentialId,
            verifierId: user.id,
            isValid,
            proofType: 'GPA_ZKP',
            proofData: JSON.stringify({ proof, publicSignals }),
          },
        });
      } catch (logErr: any) {
        logger.warn('Could not log ZKP verification:', logErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        isValid,
        circuitValid,
        threshold: thresholdGPA,
        message: isValid && circuitValid
          ? `Zero-knowledge proof valid: GPA ≥ ${thresholdGPA} confirmed`
          : isValid && !circuitValid
          ? `Proof is cryptographically valid but the GPA condition was NOT met (threshold: ${thresholdGPA})`
          : 'Proof verification failed — proof may be forged or malformed',
      },
    });
  } catch (error: any) {
    logger.error('Error verifying GPA proof:', error);
    next(error);
  }
};

/**
 * Generate experience proof (raw values supplied by caller)
 */
export const generateExperienceProof = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { experienceMonths, requiredMonths, credentialHash } = req.body;

    logger.info(`Generating experience proof: experience=${experienceMonths}, required=${requiredMonths}`);

    const salt = zkpService.generateSalt();
    const credHashBigInt = BigInt(credentialHash);

    const { proof, publicSignals } = await zkpService.generateExperienceProof({
      experienceMonths: parseInt(experienceMonths),
      requiredMonths: parseInt(requiredMonths),
      salt,
      credentialHash: credHashBigInt,
    });

    res.json({
      success: true,
      data: { proof, publicSignals, salt: salt.toString() },
    });
  } catch (error: any) {
    logger.error('Error generating experience proof:', error);
    next(error);
  }
};

/**
 * Generate experience proof from an owned credential.
 * Experience months stay server-side only.
 */
export const generateExperienceProofFromCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credentialId, requiredMonths } = req.body;
    const userId = (req as any).user.id;

    logger.info(`Generating experience proof from credential ${credentialId} for user ${userId}`);

    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      select: { id: true, credentialType: true, subjectId: true, encryptedData: true, credentialHash: true },
    });

    if (!credential) {
      res.status(404).json({ success: false, message: 'Credential not found' });
      return;
    }

    if (credential.subjectId !== userId) {
      res.status(403).json({ success: false, message: 'You can only generate proofs for your own credentials' });
      return;
    }

    if (credential.credentialType !== 'JOB' && credential.credentialType !== 'INTERNSHIP') {
      res.status(400).json({ success: false, message: 'Experience proofs require a JOB or INTERNSHIP credential' });
      return;
    }

    if (!credential.encryptedData) {
      res.status(400).json({ success: false, message: 'Credential has no encrypted data' });
      return;
    }

    const plaintext = encryptionService.decrypt(credential.encryptedData);
    
    const credentialData = JSON.parse(plaintext);
    const experienceMonths: number = credentialData?.credentialSubject?.experienceMonths;

    if (experienceMonths === undefined || experienceMonths === null || isNaN(experienceMonths)) {
      res.status(400).json({ success: false, message: 'Credential does not contain a valid experienceMonths field' });
      return;
    }

    const salt = zkpService.generateSalt();
    const credHashBigInt = BigInt(credential.credentialHash);
    const requiredMonthsInt = parseInt(requiredMonths);

    const { proof, publicSignals } = await zkpService.generateExperienceProof({
      experienceMonths,
      requiredMonths: requiredMonthsInt,
      salt,
      credentialHash: credHashBigInt,
    });

    logger.info(`Experience proof generated for credential ${credentialId} — months not disclosed`);

    res.json({
      success: true,
      data: {
        proofType: 'experience',
        proof,
        publicSignals,
        threshold: requiredMonthsInt,
        credentialHash: credential.credentialHash,
      },
    });
  } catch (error: any) {
    logger.error('Error generating experience proof from credential:', error);
    next(error);
  }
};

/**
 * Verify experience proof (public — no authentication required)
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

    // Decode public signals for human-readable response.
    // Common layouts seen in this codebase/circuits:
    // 1) [valid, requiredMonths, commitment]
    // 2) [requiredMonths, commitment, valid] (legacy parsing assumption)
    const isBinarySignal = (v: any) => v === '0' || v === '1' || v === 0 || v === 1;

    let requiredMonths: number | null = null;
    let circuitValid = false;

    if (isBinarySignal(publicSignals?.[0])) {
      circuitValid = publicSignals?.[0] === '1' || publicSignals?.[0] === 1;
      requiredMonths = publicSignals?.[1] != null ? Number(publicSignals[1]) : null;
    } else {
      // Legacy fallback
      requiredMonths = publicSignals?.[0] != null ? Number(publicSignals[0]) : null;
      circuitValid = publicSignals?.[2] === '1' || publicSignals?.[2] === 1;
    }

    const user = (req as any).user;
    if (user && req.body.credentialId) {
      try {
        await prisma.verification.create({
          data: {
            credentialId: req.body.credentialId,
            verifierId: user.id,
            isValid,
            proofType: 'EXPERIENCE_ZKP',
            proofData: JSON.stringify({ proof, publicSignals }),
          },
        });
      } catch (logErr: any) {
        logger.warn('Could not log ZKP verification:', logErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        isValid,
        circuitValid,
        threshold: requiredMonths,
        message: isValid && circuitValid
          ? `Zero-knowledge proof valid: experience ≥ ${requiredMonths} months confirmed`
          : isValid && !circuitValid
          ? `Proof is cryptographically valid but the experience condition was NOT met (required: ${requiredMonths} months)`
          : 'Proof verification failed — proof may be forged or malformed',
      },
    });
  } catch (error: any) {
    logger.error('Error verifying experience proof:', error);
    next(error);
  }
};
