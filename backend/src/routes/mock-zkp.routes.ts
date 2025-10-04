import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import * as mockZkpController from '../controllers/mock-zkp.controller';

const router = Router();

/**
 * @route   POST /api/v1/zkp/generate
 * @desc    Generate mock ZKP proof
 * @access  Public (for testing)
 */
router.post(
  '/generate',
  [
    body('credentialId').notEmpty().withMessage('Credential ID is required'),
    body('proofType').isIn(['gpa_proof', 'experience_proof']).withMessage('Invalid proof type'),
    body('threshold').isNumeric().withMessage('Threshold must be a number'),
    body('salt').optional().isString().withMessage('Salt must be a string'),
  ],
  validate,
  mockZkpController.generateMockProof
);

/**
 * @route   POST /api/v1/zkp/verify
 * @desc    Verify mock ZKP proof
 * @access  Public (for testing)
 */
router.post(
  '/verify',
  [
    body('proof').notEmpty().withMessage('Proof is required'),
    body('publicSignals').optional().isArray().withMessage('Public signals must be an array'),
  ],
  validate,
  mockZkpController.verifyMockProof
);

/**
 * @route   GET /api/v1/zkp/status
 * @desc    Get ZKP system status
 * @access  Public
 */
router.get('/status', mockZkpController.getZKPStatus);

export default router;
