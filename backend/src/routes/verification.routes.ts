import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as verificationController from '../controllers/verification.controller';

const router = Router();

/**
 * @route   POST /api/v1/verification/verify
 * @desc    Verify a credential with optional parameters
 * @access  Public (logs verifier when Authorization header is provided)
 */
router.post(
  '/verify',
  optionalAuthenticate,
  [
    body('credentialHash').notEmpty().withMessage('Credential hash is required'),
    body('verificationParams').optional().isObject().withMessage('Verification parameters must be an object'),
    body('verificationParams.minGpa').optional().isNumeric().withMessage('Minimum GPA must be a number'),
    body('verificationParams.requiredDegree').optional().isString().withMessage('Required degree must be a string'),
    body('verificationParams.requiredMajor').optional().isString().withMessage('Required major must be a string'),
    body('verificationParams.minGraduationYear').optional().isInt().withMessage('Minimum graduation year must be an integer'),
    body('verificationParams.minExperience').optional().isInt().withMessage('Minimum experience must be an integer'),
    body('verificationParams.requiredSkills').optional().isArray().withMessage('Required skills must be an array'),
  ],
  validate,
  verificationController.verifyCredential
);

/**
 * @route   GET /api/v1/verification/verify/:credentialHash
 * @desc    Public verify by credential hash (demo convenience)
 * @access  Public
 */
router.get(
  '/verify/:credentialHash',
  verificationController.verifyByHash
);

/**
 * @route   GET /api/v1/verification/:id
 * @desc    Get verification details
 * @access  Private
 */
router.get('/:id', authenticate, verificationController.getVerification);

/**
 * @route   GET /api/v1/verification/credential/:credentialId
 * @desc    Get all verifications for a credential
 * @access  Private
 */
router.get('/credential/:credentialId', authenticate, verificationController.getCredentialVerifications);

export default router;

