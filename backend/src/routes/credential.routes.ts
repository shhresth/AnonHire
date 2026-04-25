import { Router } from 'express';
import { body } from 'express-validator';
// @ts-ignore
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as credentialController from '../controllers/credential.controller';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// TODO: Remove before production — bypasses JWT auth for testing
const bypassAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const rawAddress = req.body?.issuerAddress || req.body?.subjectAddress || '0x0000000000000000000000000000000000000001';
  const address = rawAddress.toLowerCase();
  let user = await prisma.user.findUnique({ where: { address } });
  if (!user) {
    user = await prisma.user.create({ data: { address, role: 'ADMIN' } });
  }
  (req as any).user = user;
  next();
};
const bypassAuthorize = (_roles: string[]) => (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * @route   POST /api/v1/credentials/academic
 * @desc    Issue academic credential
 * @access  Private (University)
 */
router.post(
  '/academic',
  bypassAuth,
  bypassAuthorize(['UNIVERSITY', 'ADMIN']),
  [
    body('subjectAddress').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('studentName').notEmpty().withMessage('Student name is required'),
    body('degree').notEmpty().withMessage('Degree is required'),
    body('major').notEmpty().withMessage('Major is required'),
    body('gpa').isFloat({ min: 0, max: 10 }).withMessage('Invalid GPA (expected 0–10)'),
    body('graduationYear').isInt({ min: 1900, max: 2100 }).withMessage('Invalid year'),
    body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date')
  ],
  validate,
  credentialController.issueAcademicCredential
);

/**
 * @route   POST /api/v1/credentials/job
 * @desc    Issue job credential
 * @access  Private (Employer)
 */
router.post(
  '/job',
  bypassAuth,
  bypassAuthorize(['EMPLOYER', 'ADMIN']),
  [
    body('subjectAddress').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('encryptedData').optional().isString().withMessage('Encrypted data must be a string'),
    body().custom((value) => {
      // New mode: frontend sends encryptedData only.
      if (value?.encryptedData) return true;

      // Legacy mode: backend builds/encrypts payload from plaintext fields.
      if (!value?.employeeName) throw new Error('Employee name is required');
      if (!value?.position) throw new Error('Position is required');
      if (!value?.startDate) throw new Error('Start date is required');
      if (!value?.endDate) throw new Error('End date is required');
      if (value?.experienceMonths === undefined || value?.experienceMonths === null) {
        throw new Error('Experience months is required');
      }
      if (!Array.isArray(value?.skills)) throw new Error('Skills must be an array');
      return true;
    }),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('experienceMonths').optional().isInt({ min: 0 }).withMessage('Invalid experience'),
    body('skills').optional().isArray().withMessage('Skills must be an array')
  ],
  validate,
  credentialController.issueJobCredential
);

/**
 * @route   POST /api/v1/credentials/internship
 * @desc    Issue internship credential
 * @access  Private (Internship Provider/Employer)
 */
router.post(
  '/internship',
  bypassAuth,
  bypassAuthorize(['EMPLOYER', 'INTERNSHIP_PROVIDER', 'ADMIN']),
  [
    body('subjectAddress').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('internName').notEmpty().withMessage('Intern name is required'),
    body('role').notEmpty().withMessage('Role is required'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date'),
    body('skills').isArray().withMessage('Skills must be an array')
  ],
  validate,
  credentialController.issueInternshipCredential
);

/**
 * @route   POST /api/v1/credentials/:id/revoke
 * @desc    Revoke a credential
 * @access  Private (Issuer)
 */
router.post(
  '/:id/revoke',
  authenticate,
  [
    body('reason').notEmpty().withMessage('Revocation reason is required')
  ],
  validate,
  credentialController.revokeCredential
);

/**
 * @route   GET /api/v1/credentials/:id
 * @desc    Get credential by ID
 * @access  Private
 */
router.get('/:id', authenticate, credentialController.getCredential);

/**
 * @route   GET /api/v1/credentials/subject/:address
 * @desc    Get all credentials for a subject
 * @access  Private
 */
router.get('/subject/:address', authenticate, credentialController.getSubjectCredentials);

/**
 * @route   GET /api/v1/credentials/issuer/:address
 * @desc    Get all credentials issued by an issuer
 * @access  Private
 */
router.get('/issuer/:address', authenticate, credentialController.getIssuerCredentials);

/**
 * @route   GET /api/v1/credentials/:id/ipfs
 * @desc    Get credential data from IPFS
 * @access  Private
 */
router.get('/:id/ipfs', authenticate, credentialController.getCredentialFromIPFS);

/**
 * @route   GET /api/v1/credentials/:id/decrypted
 * @desc    Get decrypted credential (subject-only)
 * @access  Private (Subject)
 */
router.get('/:id/decrypted', authenticate, credentialController.getDecryptedCredential);

/**
 * @route   GET /api/v1/credentials/revoked
 * @desc    Get all revoked credentials
 * @access  Private
 */
router.get('/revoked', authenticate, credentialController.getRevokedCredentials);

export default router;


