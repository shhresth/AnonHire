import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { IPFSService } from '../services/ipfs.service';
import { BlockchainService } from '../services/blockchain.service';
import { EncryptionService } from '../services/encryption.service';
import { AuditService } from '../services/audit.service';

const prisma = new PrismaClient();
const ipfsService = new IPFSService();
const blockchainService = new BlockchainService();
const encryptionService = new EncryptionService();
const auditService = new AuditService();

/**
 * Issue an academic credential
 */
export const issueAcademicCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const issuerAddress = (req as any).user.address;
    const {
      subjectAddress,
      studentName,
      degree,
      major,
      gpa,
      graduationYear,
      institutionName,
      expiresAt
    } = req.body;

    logger.info(`Issuing academic credential for ${subjectAddress}`);

    // Prepare credential data
    const credentialData = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'AcademicCredential'],
      issuer: issuerAddress,
      issuanceDate: new Date().toISOString(),
      expirationDate: expiresAt || null,
      credentialSubject: {
        id: subjectAddress,
        name: studentName,
        degree,
        major,
        gpa: parseFloat(gpa),
        graduationYear: parseInt(graduationYear),
        institution: institutionName
      }
    };

    // Encrypt credential data
    const encryptedData = encryptionService.encrypt(JSON.stringify(credentialData));

    // Upload encrypted payload to IPFS with minimal non-sensitive public summary
    const ipfsHash = await ipfsService.uploadJSON({
      encrypted: true,
      schema: 'anonhire.v1',
      type: 'AcademicCredential',
      ciphertext: encryptedData,
      publicSummary: {
        type: 'ACADEMIC',
        issuer: issuerAddress,
        issuedAt: new Date().toISOString(),
      }
    });

    logger.info(`Credential uploaded to IPFS: ${ipfsHash}`);

    // Issue credential on blockchain (optional — continues if blockchain unavailable)
    let txHash: string | null = null;
    try {
      txHash = await blockchainService.issueAcademicVC(
        subjectAddress,
        ipfsHash,
        expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : 0
      );
      logger.info(`Credential issued on blockchain: ${txHash}`);
    } catch (blockchainError: any) {
      logger.warn(`Blockchain anchoring skipped: ${blockchainError.message}`);
    }

    // Generate credential hash
    const credentialHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${issuerAddress}${subjectAddress}${ipfsHash}${Date.now()}`)
    );

    // Save to database
    const credential = await prisma.credential.create({
      data: {
        credentialHash,
        credentialType: 'ACADEMIC',
        issuerId: (req as any).user.id,
        subjectId: await getUserIdByAddress(subjectAddress),
        ipfsHash,
        encryptedData,
        issuedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        txHash
      }
    });

    // Audit log
    await auditService.log({
      userId: (req as any).user.id,
      action: 'ISSUE_ACADEMIC_CREDENTIAL',
      resource: `credential:${credential.id}`,
      details: JSON.stringify({ subjectAddress, ipfsHash }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: {
        credentialId: credential.id,
        credentialHash,
        ipfsHash,
        txHash
      }
    });
  } catch (error: any) {
    logger.error('Error issuing academic credential:', error);
    next(error);
  }
};

/**
 * Issue a job credential
 */
export const issueJobCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const issuerAddress = (req as any).user.address;
    const {
      subjectAddress,
      encryptedData: encryptedDataFromClient,
      employeeName,
      position,
      startDate,
      endDate,
      experienceMonths,
      companyName,
      skills
    } = req.body;

    logger.info(`Issuing job credential for ${subjectAddress}`);

    // Preferred mode: client sends already-encrypted payload.
    // Legacy fallback: backend constructs payload and encrypts it.
    const encryptedData = encryptedDataFromClient || encryptionService.encrypt(JSON.stringify({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'JobCredential'],
      issuer: issuerAddress,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectAddress,
        name: employeeName,
        position,
        startDate,
        endDate,
        experienceMonths: parseInt(experienceMonths),
        company: companyName,
        skills
      }
    }));
    // Upload encrypted payload to IPFS (store ciphertext only)
    const ipfsHash = await ipfsService.uploadJSON({
      encrypted: true,
      schema: 'anonhire.v1',
      type: 'JobCredential',
      ciphertext: encryptedData,
      publicSummary: {
        type: 'JOB',
        issuer: issuerAddress,
        issuedAt: new Date().toISOString(),
      }
    });

    let txHash: string | null = null;
    try {
      txHash = await blockchainService.issueJobVC(subjectAddress, ipfsHash, 0);
      logger.info(`Credential issued on blockchain: ${txHash}`);
    } catch (blockchainError: any) {
      logger.warn(`Blockchain anchoring skipped: ${blockchainError.message}`);
    }

    const credentialHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${issuerAddress}${subjectAddress}${ipfsHash}${Date.now()}`)
    );

    const credential = await prisma.credential.create({
      data: {
        credentialHash,
        credentialType: 'JOB',
        issuerId: (req as any).user.id,
        subjectId: await getUserIdByAddress(subjectAddress),
        ipfsHash,
        encryptedData,
        issuedAt: new Date(),
        txHash
      }
    });

    await auditService.log({
      userId: (req as any).user.id,
      action: 'ISSUE_JOB_CREDENTIAL',
      resource: `credential:${credential.id}`,
      details: JSON.stringify({ subjectAddress, ipfsHash }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: {
        credentialId: credential.id,
        credentialHash,
        ipfsHash,
        txHash
      }
    });
  } catch (error: any) {
    logger.error('Error issuing job credential:', error);
    next(error);
  }
};

/**
 * Issue an internship credential
 */
export const issueInternshipCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const issuerAddress = (req as any).user.address;
    const {
      subjectAddress,
      internName,
      role,
      startDate,
      endDate,
      companyName,
      skills
    } = req.body;

    logger.info(`Issuing internship credential for ${subjectAddress}`);

    const credentialData = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'InternshipCredential'],
      issuer: issuerAddress,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectAddress,
        name: internName,
        role,
        startDate,
        endDate,
        company: companyName,
        skills
      }
    };

    const encryptedData = encryptionService.encrypt(JSON.stringify(credentialData));
    // Upload encrypted payload to IPFS (store ciphertext only)
    const ipfsHash = await ipfsService.uploadJSON({
      encrypted: true,
      schema: 'anonhire.v1',
      type: 'InternshipCredential',
      ciphertext: encryptedData,
      publicSummary: {
        type: 'INTERNSHIP',
        issuer: issuerAddress,
        issuedAt: new Date().toISOString(),
      }
    });

    let txHash: string | null = null;
    try {
      txHash = await blockchainService.issueInternshipVC(subjectAddress, ipfsHash, 0);
      logger.info(`Credential issued on blockchain: ${txHash}`);
    } catch (blockchainError: any) {
      logger.warn(`Blockchain anchoring skipped: ${blockchainError.message}`);
    }

    const credentialHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${issuerAddress}${subjectAddress}${ipfsHash}${Date.now()}`)
    );

    const credential = await prisma.credential.create({
      data: {
        credentialHash,
        credentialType: 'INTERNSHIP',
        issuerId: (req as any).user.id,
        subjectId: await getUserIdByAddress(subjectAddress),
        ipfsHash,
        encryptedData,
        issuedAt: new Date(),
        txHash
      }
    });

    await auditService.log({
      userId: (req as any).user.id,
      action: 'ISSUE_INTERNSHIP_CREDENTIAL',
      resource: `credential:${credential.id}`,
      details: JSON.stringify({ subjectAddress, ipfsHash }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: {
        credentialId: credential.id,
        credentialHash,
        ipfsHash,
        txHash
      }
    });
  } catch (error: any) {
    logger.error('Error issuing internship credential:', error);
    next(error);
  }
};

/**
 * Revoke a credential
 */
export const revokeCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.id;

    const credential = await prisma.credential.findUnique({
      where: { id }
    });

    if (!credential) {
      res.status(404).json({ success: false, message: 'Credential not found' });
      return;
    }

    if (credential.issuerId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to revoke' });
      return;
    }

    // Revoke on blockchain
    const txHash = await blockchainService.revokeVC(credential.credentialHash, reason);

    // Update database
    await prisma.credential.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: reason
      }
    });

    await auditService.log({
      userId,
      action: 'REVOKE_CREDENTIAL',
      resource: `credential:${id}`,
      details: JSON.stringify({ reason, txHash }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Credential revoked successfully',
      txHash
    });
  } catch (error: any) {
    logger.error('Error revoking credential:', error);
    next(error);
  }
};

/**
 * Get credential by ID
 */
export const getCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const credential = await prisma.credential.findUnique({
      where: { id },
      include: {
        issuer: { select: { address: true, did: true } },
        subject: { select: { address: true, did: true } }
      }
    });

    if (!credential) {
      res.status(404).json({ success: false, message: 'Credential not found' });
      return;
    }

    res.json({ success: true, data: credential });
  } catch (error: any) {
    logger.error('Error getting credential:', error);
    next(error);
  }
};

/**
 * Get all credentials for a subject
 */
export const getSubjectCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { address } = req.params;
    const requester = (req as any).user;

    // Only the wallet owner (or admin) can read subject credentials list.
    if (
      requester?.address?.toLowerCase() !== address.toLowerCase() &&
      requester?.role !== 'ADMIN'
    ) {
      res.status(403).json({ success: false, message: 'Not authorized to view these credentials' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { address: address.toLowerCase() } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const credentials = await prisma.credential.findMany({
      where: { subjectId: user.id },
      include: {
        issuer: { select: { address: true, did: true } }
      },
      orderBy: { issuedAt: 'desc' }
    });

    res.json({ success: true, data: credentials });
  } catch (error: any) {
    logger.error('Error getting subject credentials:', error);
    next(error);
  }
};

/**
 * Get all credentials issued by an issuer
 */
export const getIssuerCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { address } = req.params;

    const user = await prisma.user.findUnique({ where: { address: address.toLowerCase() } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const credentials = await prisma.credential.findMany({
      where: { issuerId: user.id },
      include: {
        subject: { select: { address: true, did: true } }
      },
      orderBy: { issuedAt: 'desc' }
    });

    res.json({ success: true, data: credentials });
  } catch (error: any) {
    logger.error('Error getting issuer credentials:', error);
    next(error);
  }
};

/**
 * Get credential data from IPFS
 */
export const getCredentialFromIPFS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const credential = await prisma.credential.findUnique({
      where: { id }
    });

    if (!credential) {
      res.status(404).json({ success: false, message: 'Credential not found' });
      return;
    }

    const ipfsData = await ipfsService.getJSON(credential.ipfsHash);

    res.json({
      success: true,
      data: {
        ipfsHash: credential.ipfsHash,
        content: ipfsData
      }
    });
  } catch (error: any) {
    logger.error('Error getting credential from IPFS:', error);
    next(error);
  }
};

/**
 * Get decrypted credential data (subject-only)
 * GET /api/v1/credentials/:id/decrypted
 */
export const getDecryptedCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const credential = await prisma.credential.findUnique({
      where: { id },
      select: {
        id: true,
        encryptedData: true,
        credentialType: true,
        issuedAt: true,
        expiresAt: true,
        issuer: { select: { address: true, did: true } },
        subjectId: true,
        subject: { select: { address: true } },
      },
    });

    if (!credential) {
      res.status(404).json({ success: false, message: 'Credential not found' });
      return;
    }

    // Allow only the subject (owner) to read decrypted content.
    // Compare both by ID and by address (case-insensitive) to handle legacy
    // records where the subject user was created with a different address casing.
    const requester = (req as any).user;
    const idMatch = credential.subjectId === requester.id;
    const addressMatch = credential.subject?.address?.toLowerCase() === requester.address?.toLowerCase();
    if (!idMatch && !addressMatch) {
      res.status(403).json({ success: false, message: 'Not authorized to view this credential' });
      return;
    }

    // Decrypt
    const plaintext = encryptionService.decrypt(credential.encryptedData || '');
    let parsed: any = null;
    try {
      parsed = JSON.parse(plaintext);
    } catch {
      parsed = { raw: plaintext };
    }

    res.json({
      success: true,
      data: {
        id: credential.id,
        type: credential.credentialType,
        issuedAt: credential.issuedAt,
        expiresAt: credential.expiresAt,
        issuer: credential.issuer,
        details: parsed?.credentialSubject || parsed,
        full: parsed,
      },
    });
  } catch (error: any) {
    logger.error('Error getting decrypted credential:', error);
    next(error);
  }
};

/**
 * Get all revoked credentials
 */
export const getRevokedCredentials = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Getting all revoked credentials');

    // Get all revoked credentials from database
    const revokedCredentials = await prisma.credential.findMany({
      where: {
        isRevoked: true,
      },
      include: {
        issuer: true,
        subject: true,
      },
      orderBy: {
        revokedAt: 'desc',
      },
    });

    // Format the response
    const formattedCredentials = revokedCredentials.map(credential => ({
      id: credential.id,
      credentialHash: credential.credentialHash,
      credentialType: credential.credentialType,
      issuer: credential.issuer.address,
      subject: credential.subject.address,
      revokedAt: credential.revokedAt,
      revocationReason: credential.revocationReason,
      txHash: credential.txHash,
    }));

    res.json({
      success: true,
      data: formattedCredentials,
    });
  } catch (error: any) {
    logger.error('Error getting revoked credentials:', error);
    next(error);
  }
};

/**
 * Helper function to get user ID by address
 */
async function getUserIdByAddress(address: string): Promise<string> {
  const normalizedAddress = address.toLowerCase();
  let user = await prisma.user.findUnique({ where: { address: normalizedAddress } });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        address: normalizedAddress,
        role: 'CANDIDATE'
      }
    });
  }
  
  return user.id;
}

