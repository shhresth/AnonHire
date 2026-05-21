import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as zkpController from '../controllers/zkp.controller';

const router = Router();

/**
 * @route   POST /api/v1/zkp/gpa/generate
 * @desc    Generate GPA proof (raw values — caller supplies gpa + threshold)
 * @access  Private
 */
router.post(
  '/gpa/generate',
  authenticate,
  [
    body('gpa').isFloat({ min: 0, max: 10 }).withMessage('GPA must be between 0.0 and 10.0'),
    body('threshold').isFloat({ min: 0, max: 10 }).withMessage('GPA threshold must be between 0.0 and 10.0'),
    body('credentialHash').notEmpty().withMessage('Credential hash is required'),
  ],
  validate,
  zkpController.generateGPAProof
);

/**
 * @route   POST /api/v1/zkp/gpa/generate-from-credential
 * @desc    Generate GPA proof from an owned credential (decrypts internally — GPA never leaves server)
 * @access  Private (candidate must own the credential)
 */
router.post(
  '/gpa/generate-from-credential',
  authenticate,
  [
    body('credentialId').notEmpty().withMessage('Credential ID is required'),
    body('threshold').isFloat({ min: 0, max: 10 }).withMessage('GPA threshold must be between 0.0 and 10.0'),
  ],
  validate,
  zkpController.generateGPAProofFromCredential
);

/**
 * @route   POST /api/v1/zkp/gpa/verify
 * @desc    Verify GPA proof — public endpoint, no auth required
 * @access  Public
 */
router.post(
  '/gpa/verify',
  [
    body('proof').notEmpty().withMessage('Proof is required'),
    body('publicSignals').isArray().withMessage('Public signals must be an array'),
  ],
  validate,
  zkpController.verifyGPAProof
);

/**
 * @route   POST /api/v1/zkp/experience/generate
 * @desc    Generate experience proof (raw values)
 * @access  Private
 */
router.post(
  '/experience/generate',
  authenticate,
  [
    body('experienceMonths').isInt({ min: 0 }).withMessage('Invalid experience'),
    body('requiredMonths').isInt({ min: 0 }).withMessage('Invalid required months'),
    body('credentialHash').notEmpty().withMessage('Credential hash is required'),
  ],
  validate,
  zkpController.generateExperienceProof
);

/**
 * @route   POST /api/v1/zkp/experience/generate-from-credential
 * @desc    Generate experience proof from an owned credential (decrypts internally)
 * @access  Private (candidate must own the credential)
 */
router.post(
  '/experience/generate-from-credential',
  authenticate,
  [
    body('credentialId').notEmpty().withMessage('Credential ID is required'),
    body('requiredMonths').isInt({ min: 0 }).withMessage('Required months must be a non-negative integer'),
  ],
  validate,
  zkpController.generateExperienceProofFromCredential
);

/**
 * @route   POST /api/v1/zkp/experience/verify
 * @desc    Verify experience proof — public endpoint, no auth required
 * @access  Public
 */
router.post(
  '/experience/verify',
  [
    body('proof').notEmpty().withMessage('Proof is required'),
    body('publicSignals').isArray().withMessage('Public signals must be an array'),
  ],
  validate,
  zkpController.verifyExperienceProof
);

export default router;
