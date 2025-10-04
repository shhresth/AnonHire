import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as verificationController from '../controllers/verification.controller';

const router = Router();

/**
 * @route   POST /api/v1/verification/verify
 * @desc    Verify a credential
 * @access  Private
 */
router.post(
  '/verify',
  authenticate,
  [body('credentialHash').notEmpty().withMessage('Credential hash is required')],
  validate,
  verificationController.verifyCredential
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


