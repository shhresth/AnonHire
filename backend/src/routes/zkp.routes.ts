import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as zkpController from '../controllers/zkp.controller';

const router = Router();

/**
 * @route   POST /api/v1/zkp/gpa/generate
 * @desc    Generate GPA proof
 * @access  Private
 */
router.post(
  '/gpa/generate',
  authenticate,
  [
    body('gpa').isFloat({ min: 0, max: 4 }).withMessage('Invalid GPA'),
    body('threshold').isFloat({ min: 0, max: 4 }).withMessage('Invalid threshold'),
    body('credentialHash').notEmpty().withMessage('Credential hash is required'),
  ],
  validate,
  zkpController.generateGPAProof
);

/**
 * @route   POST /api/v1/zkp/gpa/verify
 * @desc    Verify GPA proof
 * @access  Private
 */
router.post(
  '/gpa/verify',
  authenticate,
  [
    body('proof').notEmpty().withMessage('Proof is required'),
    body('publicSignals').isArray().withMessage('Public signals must be an array'),
  ],
  validate,
  zkpController.verifyGPAProof
);

/**
 * @route   POST /api/v1/zkp/experience/generate
 * @desc    Generate experience proof
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
 * @route   POST /api/v1/zkp/experience/verify
 * @desc    Verify experience proof
 * @access  Private
 */
router.post(
  '/experience/verify',
  authenticate,
  [
    body('proof').notEmpty().withMessage('Proof is required'),
    body('publicSignals').isArray().withMessage('Public signals must be an array'),
  ],
  validate,
  zkpController.verifyExperienceProof
);

export default router;


