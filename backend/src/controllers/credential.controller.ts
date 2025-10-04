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

    // Upload to IPFS
    const ipfsHash = await ipfsService.uploadJSON({
      ...credentialData,
      encrypted: true
    });

    logger.info(`Credential uploaded to IPFS: ${ipfsHash}`);

    // Issue credential on blockchain
    const txHash = await blockchainService.issueAcademicVC(
      subjectAddress,
      ipfsHash,
      expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : 0
    );

    logger.info(`Credential issued on blockchain: ${txHash}`);

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
      employeeName,
      position,
      startDate,
      endDate,
      experienceMonths,
      companyName,
      skills
    } = req.body;

    logger.info(`Issuing job credential for ${subjectAddress}`);

    const credentialData = {
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
    };

    const encryptedData = encryptionService.encrypt(JSON.stringify(credentialData));
    const ipfsHash = await ipfsService.uploadJSON({ ...credentialData, encrypted: true });

    const txHash = await blockchainService.issueJobVC(subjectAddress, ipfsHash, 0);

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
    const ipfsHash = await ipfsService.uploadJSON({ ...credentialData, encrypted: true });

    const txHash = await blockchainService.issueInternshipVC(subjectAddress, ipfsHash, 0);

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

    const user = await prisma.user.findUnique({ where: { address } });
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

    const user = await prisma.user.findUnique({ where: { address } });
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
 * Helper function to get user ID by address
 */
async function getUserIdByAddress(address: string): Promise<string> {
  let user = await prisma.user.findUnique({ where: { address } });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        address,
        role: 'CANDIDATE'
      }
    });
  }
  
  return user.id;
}

