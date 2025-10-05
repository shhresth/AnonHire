import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as credentialController from '../controllers/credential.controller';

const router = Router();

/**
 * @route   POST /api/v1/credentials/academic
 * @desc    Issue academic credential
 * @access  Private (University)
 */
router.post(
  '/academic',
  authenticate,
  authorize(['UNIVERSITY', 'ADMIN']),
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
  authenticate,
  authorize(['EMPLOYER', 'ADMIN']),
  [
    body('subjectAddress').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('employeeName').notEmpty().withMessage('Employee name is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date'),
    body('experienceMonths').isInt({ min: 0 }).withMessage('Invalid experience'),
    body('skills').isArray().withMessage('Skills must be an array')
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
  authenticate,
  authorize(['EMPLOYER', 'INTERNSHIP_PROVIDER', 'ADMIN']),
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

export default router;


